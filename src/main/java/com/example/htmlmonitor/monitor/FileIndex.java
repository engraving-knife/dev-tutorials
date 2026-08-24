package com.example.htmlmonitor.monitor;

import com.example.htmlmonitor.model.FileNode;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * 文件索引（监控目录的两级目录快照）。
 *
 * 设计意图：
 * 1. 维护一份“当前磁盘上 HTML 文件分布”的内存快照，供 /api/files 接口
 *    即时返回，避免每次请求都扫描磁盘，提升展示性能；
 * 2. 快照通过 volatile 引用 + 全量重建的方式无锁发布，监控线程写入、HTTP 线程
 *    读取，互不阻塞且始终能看到最新数据；
 * 3. 采用“事件触发后全量重建”而非增量合并，是因为本地目录规模通常可控，
 *    全量重建逻辑简单、不存在增量合并的边界问题（重命名、删除、嵌套目录等）；
 * 4. 快照为两级结构：第一级是监控根目录下的第一级子目录名，第二级是该目录
 *    下递归收集的全部 HTML 文件（含深层子目录），根目录下直接存放的 HTML
 *    文件则归入以根目录命名的分组，保证不遗漏。
 */
public class FileIndex {

    private final Path root;

    /** 当前目录树快照根节点；volatile 保证多线程可见性 */
    private volatile FileNode rootNode;

    public FileIndex(Path root) {
        this.root = root;
    }

    public Path getRoot() {
        return root;
    }

    /**
     * 全量重建两级目录快照。
     * 由目录监听线程在收到文件变化事件后调用，使快照与磁盘实时保持一致。
     */
    public synchronized void rebuild() {
        this.rootNode = buildTree(root);
    }

    /**
     * 获取当前快照根节点。
     *
     * @return 根目录节点；快照尚未构建时返回 null
     */
    public FileNode getRootNode() {
        return rootNode;
    }

    /**
     * 构建两级目录树。
     * 第一级：监控根目录下的第一级子目录（仅保留其中含有 HTML 文件的目录），
     * 以及一个以根目录命名的分组（存放根目录下直接存放的 HTML 文件）；
     * 第二级：该目录下递归收集到的全部 HTML 文件，携带完整相对路径。
     *
     * @param rootDir 监控根目录
     * @return 构建完成的两级目录树根节点
     */
    private FileNode buildTree(Path rootDir) {
        FileNode rootNode = new FileNode();
        rootNode.setName(rootDir.getFileName() == null ? rootDir.toString() : rootDir.getFileName().toString());
        rootNode.setRelativePath("");
        rootNode.setDirectory(true);

        // 收集根目录下直接存放的 HTML 文件（归入根分组）
        List<FileNode> rootLevelHtml = new ArrayList<>();

        for (Path item : listSorted(rootDir)) {
            String name = item.getFileName().toString();
            if (Files.isDirectory(item)) {
                // 第一级子目录：递归收集其下全部 HTML 作为第二级
                List<FileNode> htmlFiles = new ArrayList<>();
                collectHtmlFiles(item, name, htmlFiles);
                if (!htmlFiles.isEmpty()) {
                    FileNode dirNode = new FileNode();
                    dirNode.setName(name);
                    dirNode.setRelativePath(name);
                    dirNode.setDirectory(true);
                    dirNode.setChildren(htmlFiles);
                    rootNode.getChildren().add(dirNode);
                }
            } else if (isHtmlFile(name)) {
                rootLevelHtml.add(buildFileNode(item, name));
            }
        }

        // 根目录下的直接 HTML 文件以根目录名作为第一级分组，保证不遗漏
        if (!rootLevelHtml.isEmpty()) {
            FileNode rootGroup = new FileNode();
            rootGroup.setName(rootNode.getName());
            rootGroup.setRelativePath("");
            rootGroup.setDirectory(true);
            rootGroup.setChildren(rootLevelHtml);
            rootNode.getChildren().add(rootGroup);
        }
        return rootNode;
    }

    /**
     * 递归收集目录下所有 HTML 文件（含深层子目录），扁平放入输出列表。
     * 每个文件节点的相对路径以 base 为前缀，保证 /html/ 接口可正确定位。
     *
     * @param dir  当前遍历的磁盘目录
     * @param base 当前目录相对监控根目录的路径前缀
     * @param out  收集结果的输出列表
     */
    private void collectHtmlFiles(Path dir, String base, List<FileNode> out) {
        for (Path item : listSorted(dir)) {
            String name = item.getFileName().toString();
            if (Files.isDirectory(item)) {
                // 继续深入子目录，路径前缀随之拼接
                collectHtmlFiles(item, join(base, name), out);
            } else if (isHtmlFile(name)) {
                out.add(buildFileNode(item, join(base, name)));
            }
        }
    }

    /**
     * 构建单个 HTML 文件节点，附带大小与最后修改时间。
     */
    private FileNode buildFileNode(Path file, String relPath) {
        FileNode node = new FileNode();
        node.setName(file.getFileName().toString());
        node.setRelativePath(relPath);
        node.setDirectory(false);
        try {
            node.setSize(Files.size(file));
            node.setLastModified(Files.getLastModifiedTime(file).toMillis());
        } catch (IOException ignored) {
            // 文件可能在统计过程中被删除，保留默认值即可
        }
        return node;
    }

    /**
     * 读取目录条目并按名称排序。
     * 目录读取失败（如已被删除）时返回空列表，避免监控线程崩溃。
     */
    private List<Path> listSorted(Path dir) {
        List<Path> items = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path p : stream) {
                items.add(p);
            }
        } catch (IOException e) {
            return items;
        }
        items.sort(Comparator.comparing(Path::getFileName));
        return items;
    }

    /**
     * 判断文件是否为 HTML 文件（忽略大小写）。
     */
    private boolean isHtmlFile(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        return lower.endsWith(".html") || lower.endsWith(".htm");
    }

    /**
     * 拼接相对路径。
     *
     * @param base 已有相对路径，可能为空字符串
     * @param name 待追加的路径片段
     * @return 拼接后的相对路径
     */
    private String join(String base, String name) {
        return base.isEmpty() ? name : base + "/" + name;
    }
}
