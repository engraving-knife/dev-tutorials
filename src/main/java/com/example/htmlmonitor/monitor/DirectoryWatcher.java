package com.example.htmlmonitor.monitor;

import java.io.IOException;
import java.nio.file.ClosedWatchServiceException;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.logging.Logger;

import static java.nio.file.StandardWatchEventKinds.ENTRY_CREATE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_DELETE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_MODIFY;
import static java.nio.file.StandardWatchEventKinds.OVERFLOW;

/**
 * 目录实时监听器，基于 JDK 的 java.nio.file.WatchService 实现。
 *
 * 设计意图：
 * 1. 监听监控根目录及其所有子目录（递归注册），保证嵌套目录内的文件增删改
 *    也能被实时感知；
 * 2. 在独立守护线程中阻塞等待系统文件事件，事件到达后触发 FileIndex 全量重建，
 *    实现“本地文件变化 -> 前端目录实时同步”的核心链路；
 * 3. 新出现子目录时动态补注册监听，目录被删除导致 key 失效时自动清理登记表，
 *    保证长时间运行下的健壮性。
 */
public class DirectoryWatcher {

    private static final Logger LOGGER = Logger.getLogger(DirectoryWatcher.class.getName());

    /** 监控根目录 */
    private final Path root;

    /** 事件触发后需要同步更新的文件索引 */
    private final FileIndex index;

    /** 底层 WatchService */
    private final WatchService watchService;

    /** 已注册监听的目录登记表：WatchKey -> 对应的目录路径 */
    private final Map<WatchKey, Path> registeredKeys = new ConcurrentHashMap<>();

    /** 运行状态标记 */
    private final AtomicBoolean running = new AtomicBoolean(false);

    /** 后台监听线程 */
    private Thread workerThread;

    public DirectoryWatcher(Path root, FileIndex index) throws IOException {
        this.root = root;
        this.index = index;
        this.watchService = FileSystems.getDefault().newWatchService();
    }

    /**
     * 启动监听：先递归注册所有目录，再启动后台监听线程。
     */
    public void start() {
        try {
            registerRecursively(root);
        } catch (IOException e) {
            throw new IllegalStateException("监控目录注册失败: " + root, e);
        }
        running.set(true);
        workerThread = new Thread(this::runLoop, "html-directory-watcher");
        workerThread.setDaemon(true);
        workerThread.start();
        LOGGER.info("目录监听已启动: " + root.toAbsolutePath());
    }

    /**
     * 停止监听，释放 WatchService 资源。
     */
    public void stop() {
        running.set(false);
        try {
            watchService.close();
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, "关闭 WatchService 失败", e);
        }
    }

    /**
     * 递归注册目录及其全部子目录到 WatchService。
     * 对 CREATE / MODIFY / DELETE 三类事件感兴趣：新增、修改、删除都能感知。
     */
    private void registerRecursively(Path dir) throws IOException {
        Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult preVisitDirectory(Path d, BasicFileAttributes attrs) throws IOException {
                WatchKey key = d.register(watchService, ENTRY_CREATE, ENTRY_MODIFY, ENTRY_DELETE);
                registeredKeys.put(key, d);
                return FileVisitResult.CONTINUE;
            }
        });
    }

    /**
     * 后台监听主循环：阻塞等待文件事件，事件到达后重建文件索引快照。
     */
    private void runLoop() {
        while (running.get()) {
            WatchKey key;
            try {
                key = watchService.take();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (ClosedWatchServiceException e) {
                // 服务已停止，正常退出
                break;
            }

            Path dir = registeredKeys.get(key);
            if (dir == null) {
                continue;
            }

            boolean rebuilt = false;
            for (WatchEvent<?> event : key.pollEvents()) {
                WatchEvent.Kind<?> kind = event.kind();
                if (kind == OVERFLOW) {
                    // 事件溢出：无法逐条处理，直接全量重建保证一致性
                    index.rebuild();
                    rebuilt = true;
                    continue;
                }

                Path child = dir.resolve((Path) event.context());
                if (kind == ENTRY_CREATE && Files.isDirectory(child)) {
                    // 出现新子目录：补注册其内部监听，保证嵌套目录内的变化也能感知
                    try {
                        registerRecursively(child);
                    } catch (IOException e) {
                        LOGGER.log(Level.WARNING, "新子目录注册失败: " + child, e);
                    }
                }

                if (!rebuilt) {
                    // 一次事件批只重建一次，避免重复扫描
                    index.rebuild();
                    rebuilt = true;
                }
            }

            if (!key.reset()) {
                // reset 返回 false 表示该目录已被删除，从登记表移除
                registeredKeys.remove(key);
            }
        }
        LOGGER.info("目录监听已停止");
    }
}
