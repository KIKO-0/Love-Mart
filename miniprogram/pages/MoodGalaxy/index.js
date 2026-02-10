const app = getApp();
const db = wx.cloud.database();

Page({
    data: {
        stars: [], // Stars loaded from DB
        showModal: false,
        currentMood: 'happy',
        content: '',
        loading: false,
        tempImage: '', // Local path
        moodList: [
            { id: 'happy', icon: '😊', color: '#ffd700' },
            { id: 'love', icon: '🥰', color: '#ff6b6b' },
            { id: 'sad', icon: '🌧️', color: '#4facfe' },
            { id: 'dreamy', icon: '🦄', color: '#e0c3fc' },
            { id: 'angry', icon: '😡', color: '#ff4757' },
            { id: 'tired', icon: '😴', color: '#a4b0be' },
            { id: 'excited', icon: '🎉', color: '#2ed573' },
            { id: 'relaxed', icon: '☕', color: '#ffa502' }
        ]
    },

    onLoad() {
        this.getStars();
    },

    // ... (Existing getStars logic) ...
    async getStars() {
        const _ = db.command;
        try {
            const res = await db.collection('stars')
                .where({
                    // Only show stars from userA or userB
                    _openid: _.in([app.globalData._openidA, app.globalData._openidB])
                })
                .orderBy('date', 'desc')
                .limit(50) // Limit to recent 50 for performance
                .get();

            const stars = res.data.map(item => {
                // Ensure x,y exist (legacy compatibility)
                if (typeof item.x !== 'number') item.x = Math.random() * 80 + 10;
                if (typeof item.y !== 'number') item.y = Math.random() * 60 + 20;

                // FORCE SAFE ZONE: If star is too high (in header area), move it down
                if (item.y < 20) {
                    item.y = Math.random() * 60 + 20; // Re-roll position
                }
                return item;
            });

            this.setData({ stars });
        } catch (err) {
            console.error('Failed to load stars', err);
        }
    },

    // --- Modal Interaction ---

    onAddStar() {
        this.setData({ showModal: true, tempImage: '' });
    },

    closeModal() {
        this.setData({ showModal: false });
    },

    preventBubble() { },

    selectMood(e) {
        this.setData({ currentMood: e.currentTarget.dataset.mood });
    },

    onInputContent(e) {
        this.setData({ content: e.detail.value });
    },

    // --- Image Logic ---
    onChooseImage() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath;
                this.setData({ tempImage: tempFilePath });
            }
        });
    },

    onRemoveImage() {
        this.setData({ tempImage: '' });
    },

    async submitStar() {
        if (!this.data.content.trim() && !this.data.tempImage) {
            wx.showToast({
                title: 'Write or Snap!',
                icon: 'none'
            });
            return;
        }

        this.setData({ loading: true });

        try {
            let fileID = '';

            // Upload Image if selected
            if (this.data.tempImage) {
                const cloudPath = `stars/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
                const uploadRes = await wx.cloud.uploadFile({
                    cloudPath: cloudPath,
                    filePath: this.data.tempImage
                });
                fileID = uploadRes.fileID;
            }

            const newStar = {
                mood: this.data.currentMood,
                content: this.data.content,
                image: fileID, // Save fileID
                date: new Date().getTime(),
                // Generate random position immediately
                x: Math.random() * 80 + 10, // 10% - 90% width
                y: Math.random() * 60 + 20  // 20% - 80% height (Avoid Header)
            };

            await db.collection('stars').add({
                data: newStar
            });

            // Optimistic Update
            this.setData({
                stars: [newStar, ...this.data.stars],
                showModal: false,
                content: '',
                tempImage: '',
                currentMood: 'happy'
            });

            wx.showToast({
                title: 'Sent to Galaxy! 🚀',
                icon: 'none'
            });

        } catch (err) {
            console.error(err);
            wx.showToast({
                title: 'Failed to emit',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    onViewStar(e) {
        const star = e.currentTarget.dataset.star;
        const date = new Date(star.date).toLocaleDateString();

        // Find emoji from moodList
        const moodItem = this.data.moodList.find(m => m.id === star.mood);
        const emoji = moodItem ? moodItem.icon : '✨';

        this.setData({
            showDetailModal: true,
            selectedStar: star,
            selectedStarDate: date,
            selectedStarEmoji: emoji,
            currentImageLink: star.image // Default to cloud ID initially
        });

        // Explicitly fetch new signed URL using Cloud Function (Admin Access)
        if (star.image) {
            wx.cloud.callFunction({
                name: 'getTempUrl',
                data: {
                    fileList: [star.image]
                },
                success: res => {
                    if (res.result.fileList && res.result.fileList[0].tempFileURL) {
                        this.setData({
                            currentImageLink: res.result.fileList[0].tempFileURL
                        });
                    }
                },
                fail: err => console.error('Cloud Link fetch failed', err)
            });
        }
    },

    closeDetailModal() {
        this.setData({ showDetailModal: false, selectedStar: null });
    },

    previewDetailImage() {
        if (this.data.currentImageLink) {
            wx.previewImage({
                urls: [this.data.currentImageLink]
            });
        }
    },

    deleteStar() {
        const star = this.data.selectedStar;
        if (!star) return;

        wx.showModal({
            title: 'Delete Star?',
            content: 'This memory will be lost in space forever.',
            confirmColor: '#ff4757',
            success: async (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: 'Deleting...' });
                    try {
                        // 1. Delete from DB
                        await db.collection('stars').doc(star._id).remove();

                        // 2. Delete from Storage (if has image)
                        if (star.image) {
                            await wx.cloud.deleteFile({ fileList: [star.image] });
                        }

                        // 3. Update Local State
                        const newStars = this.data.stars.filter(s => s._id !== star._id);
                        this.setData({ stars: newStars, showDetailModal: false });

                        wx.showToast({ title: 'Deleted', icon: 'success' });

                    } catch (err) {
                        console.error(err);
                        wx.showToast({ title: 'Failed', icon: 'none' });
                    } finally {
                        wx.hideLoading();
                    }
                }
            }
        })
    }
})
