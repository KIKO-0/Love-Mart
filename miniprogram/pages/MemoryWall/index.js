const app = getApp();
const db = wx.cloud.database();

Page({
    data: {
        memories: [],
        loading: false,

        // Upload Modal State
        showUploadModal: false,
        tempImage: '',
        uploadContent: '',

        // Detail Modal State
        showDetailModal: false,
        selectedMemory: null
    },

    onLoad() {
        this.getMemories();
    },

    onPullDownRefresh() {
        this.getMemories().then(() => {
            wx.stopPullDownRefresh();
        });
    },

    async getMemories() {
        this.setData({ loading: true });
        const _ = db.command;
        try {
            const res = await db.collection('stars')
                .where({
                    // Only show memories from userA or userB
                    _openid: _.in([app.globalData._openidA, app.globalData._openidB])
                })
                .orderBy('date', 'desc') // Ensure sorted by date descending
                .limit(50) // Increased limit
                .get();

            // Filter only those with images
            let memories = res.data.filter(item => item.image && item.image.length > 0);

            // Calculate Date Str
            memories = memories.map(item => {
                const dateObj = new Date(item.date);
                item.dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
                // Init displayImage with original ID (fallback)
                item.displayImage = item.image;
                return item;
            });

            this.setData({ memories });

            // --- NEW: Batch Fetch Real URLs (Admin Access) ---
            const fileList = memories.map(m => m.image);
            if (fileList.length > 0) {
                wx.cloud.callFunction({
                    name: 'getTempUrl',
                    data: { fileList },
                    success: res => {
                        const urlMap = {};
                        res.result.fileList.forEach(f => {
                            urlMap[f.fileID] = f.tempFileURL;
                        });

                        // Update memories with real URLs
                        const updatedMemories = memories.map(m => {
                            if (urlMap[m.image]) {
                                m.displayImage = urlMap[m.image];
                            }
                            return m;
                        });
                        this.setData({ memories: updatedMemories });
                    },
                    fail: err => console.error('Batch fetch failed', err)
                });
            }

        } catch (err) {
            console.error(err);
            wx.showToast({ title: 'Failed to load', icon: 'none' });
        } finally {
            this.setData({ loading: false });
        }
    },

    // --- Upload Flow ---

    onAddMemory() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath;
                // Open Modal instead of direct upload
                this.setData({
                    showUploadModal: true,
                    tempImage: tempFilePath,
                    uploadContent: '' // Reset content
                });
            }
        })
    },

    onInputContent(e) {
        this.setData({ uploadContent: e.detail.value });
    },

    closeUploadModal() {
        this.setData({ showUploadModal: false, tempImage: '' });
    },

    async confirmUpload() {
        if (!this.data.tempImage) return;

        this.setData({ loading: true });
        wx.showLoading({ title: 'Uploading...' });

        try {
            const cloudPath = `memories/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
            const uploadRes = await wx.cloud.uploadFile({
                cloudPath,
                filePath: this.data.tempImage
            });

            await this.addMemoryToDB(uploadRes.fileID);

            this.closeUploadModal();

        } catch (err) {
            console.error(err);
            wx.showToast({ title: 'Upload Failed', icon: 'none' });
        } finally {
            wx.hideLoading();
            this.setData({ loading: false });
        }
    },

    async addMemoryToDB(fileID) {
        try {
            await db.collection('stars').add({
                data: {
                    content: this.data.uploadContent || 'Shared a memory', // Use input content
                    date: new Date().getTime(),
                    mood: 'happy',
                    image: fileID,
                    x: Math.random() * 80 + 10,
                    y: Math.random() * 60 + 20
                }
            });

            wx.showToast({ title: 'Memory Saved!', icon: 'success' });
            this.getMemories(); // Refresh

        } catch (err) {
            wx.showToast({ title: 'Save Failed', icon: 'none' });
        }
    },

    // --- Detail View (Lightbox) ---

    viewMemory(e) {
        const url = e.currentTarget.dataset.url;
        // Match by displayImage OR original image (fallback cleanup)
        const memory = this.data.memories.find(m => m.displayImage === url || m.image === url);

        this.setData({
            showDetailModal: true,
            selectedMemory: memory
        });
    },

    closeDetailModal() {
        this.setData({ showDetailModal: false, selectedMemory: null });
    },

    // --- Delete Logic ---

    async deleteMemory() {
        const memory = this.data.selectedMemory;
        if (!memory) return;

        wx.showModal({
            title: 'Delete Memory?',
            content: 'This action cannot be undone.',
            confirmColor: '#ff4757',
            success: async (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: 'Deleting...' });
                    try {
                        // 1. Delete from DB
                        await db.collection('stars').doc(memory._id).remove();

                        // 2. Delete from Cloud Storage (Optional, good practice)
                        await wx.cloud.deleteFile({ fileList: [memory.image] });

                        wx.showToast({ title: 'Deleted', icon: 'success' });

                        // 3. Close Modal and Refresh
                        this.closeDetailModal();
                        this.getMemories();

                    } catch (err) {
                        console.error(err);
                        wx.showToast({ title: 'Delete Failed', icon: 'none' });
                    } finally {
                        wx.hideLoading();
                    }
                }
            }
        })
    },

    preventBubble() { } // Prevent closing when clicking content
})
