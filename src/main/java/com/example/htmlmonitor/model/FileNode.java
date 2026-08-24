package com.example.htmlmonitor.model;

import java.util.ArrayList;
import java.util.List;

/**
 * 目录树节点模型。
 *
 * 设计意图：
 * 作为“监控目录快照”的通用数据结构，既描述目录节点也描述文件节点。
 * 前端目录树直接由该模型的树形结构渲染而来，因此节点中的 relativePath
 * 使用 "/" 分隔、相对监控根目录，保证前端展示的目录结构与本地目录一一对应。
 */
public class FileNode {

    /** 节点名称（目录名或文件名） */
    private String name;

    /** 相对监控根目录的路径，用 "/" 分隔；根节点为空字符串 */
    private String relativePath;

    /** 是否为目录 */
    private boolean directory;

    /** 文件大小（字节），目录节点恒为 0 */
    private long size;

    /** 文件最后修改时间（毫秒时间戳），目录节点恒为 0 */
    private long lastModified;

    /** 子节点列表，目录节点才有意义 */
    private List<FileNode> children = new ArrayList<>();

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRelativePath() {
        return relativePath;
    }

    public void setRelativePath(String relativePath) {
        this.relativePath = relativePath;
    }

    public boolean isDirectory() {
        return directory;
    }

    public void setDirectory(boolean directory) {
        this.directory = directory;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public long getLastModified() {
        return lastModified;
    }

    public void setLastModified(long lastModified) {
        this.lastModified = lastModified;
    }

    public List<FileNode> getChildren() {
        return children;
    }

    public void setChildren(List<FileNode> children) {
        this.children = children;
    }
}
