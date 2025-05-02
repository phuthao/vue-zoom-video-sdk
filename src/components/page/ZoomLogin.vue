<template>
<div class="perfect-fit-container">
    <div id="sessionContainer" class="perfect-fit-session" ></div>
    <container class="formRegister" v-show="!isButtonDisabled">
        <div class="card card-custom gutter-b">

            <div class="form-container">
                <div class="textheader">
                    <p>Zoom Video</p>
                </div>
                <div class="form-group">
                    <input type="text" id="topic" name="topic" placeholder="Tên buổi họp" v-model="topic" required />
                </div>
                <div class="form-group">
                    <input type="text" id="user_identity" name="user_identity" placeholder="Tên người dùng" v-model="user_identity" required />
                </div>
                <div class="form-group">
                    <select id="role" name="role" v-model="role" class="selected" title="Nếu tạo cuộc họp thì Role mặc định là host">
                        <option value="0">User</option>
                        <option value="1">Host</option>
                    </select>
                </div>
                <button class="btnCreateSession" @click="initSession">
                    Start Session
                </button>
            </div>
        </div>
    </container>
    <div v-if="isButtonDisabled" class="floating-controls">
        <!-- <button class="control-button copy-button" @click="copyLinkSurvey">Copy Link</button> -->
        <!-- <button class="control-button exit-button" @click="sessionClosed">Exit</button> -->
    </div>
</div>
</template>

<script>
import uitoolkit from '@zoom/videosdk-ui-toolkit';
import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css';
import {
    generateSessionToken
} from './js/tool.js';
import {
    getConfig
} from './js/config.js';
import {
    v4 as uuidv4
} from 'uuid';
export default {
    name: 'ZoomLogin',
    props: {
        msg: String,
    },
    data() {
        return {
            sessionToken: '',
            sessionContainer: '',
            topic: '',
            password: '1',
            user_identity: '',
            role: 1,
            isButtonDisabled: false,
            isButtonRecording: false,
            sessionData: '',
        };
    },
    mounted() {
        // Apply styles to prevent scrolling on document body
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';

        // Add event listener for detecting viewport changes
        window.addEventListener('resize', this.enforceFullscreen);
    },

    beforeDestroy() {
        // Remove styles when component is destroyed
        document.body.style.overflow = '';
        document.body.style.margin = '';
        document.body.style.padding = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.margin = '';
        document.documentElement.style.padding = '';

        window.removeEventListener('resize', this.enforceFullscreen);
    },

    methods: {
        enforceFullscreen() {
            if (this.isButtonDisabled) {
                const sessionElem = document.getElementById('sessionContainer');
                if (sessionElem) {
                    // Force exact dimensions of a 15.6-inch screen (assuming 16:9 aspect ratio)
                    // Apply container styling
                    sessionElem.style.width = '100%';
                    sessionElem.style.height = '100%';
                    sessionElem.style.overflow = 'hidden';

                    // Find and adjust Zoom's specific elements
                    this.adjustZoomElements(sessionElem);
                }
            }
        },

        adjustZoomElements(container) {
            // Target all possible Zoom UI elements that might have scrollbars or overflow
            const selectors = [
                '.zm-video', '.zm-grid', '.zm-meeting', '.zm-participants',
                '.zm-canvas', '.zm-video-frame', '.zm-video-container'
            ];

            selectors.forEach(selector => {
                const elements = container.querySelectorAll(selector);
                if (elements && elements.length > 0) {
                    elements.forEach(elem => {
                        elem.style.width = '100%';
                        elem.style.height = '100%';
                        elem.style.objectFit = 'contain';
                        elem.style.maxWidth = '100%';
                        elem.style.maxHeight = '100%';
                        elem.style.overflow = 'hidden';
                    });
                }
            });

            // Find and adjust any potential scrollable containers
            const scrollableElements = container.querySelectorAll('div');
            scrollableElements.forEach(elem => {
                const style = window.getComputedStyle(elem);
                if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                    style.overflowX === 'auto' || style.overflowX === 'scroll' ||
                    style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    elem.style.overflow = 'hidden';
                    elem.style.overflowX = 'hidden';
                    elem.style.overflowY = 'hidden';
                }
            });
        },

        copyLinkSurvey() {
            if (this.topic && this.topic.trim() !== '') {
                const img = 'http://diab.com.vn/wp-content/uploads/2024/03/zoom.jpg';
                const name = 'Trao đổi cùng chuyên gia và huấn luyện viên của DIAB ⬆️⬆️⬆️';
                const longDynamicLink = `https://click.diab.com.vn/meet/?link=https://diab.com.vn/?calendar%3D${this.topic}&apn=com.vbhc.diab&isi=1569353448&sd=Ứng dụng hoàn toàn miễn phí giúp kiểm soát bệnh đái tháo đường và kết nối với chuyên gia&ibi=com.cactusoftware.diab&si=${img}&st=${name}`;
                this.$api
                    .getFirebaseDynamicLinks({
                        longDynamicLink: longDynamicLink,
                    })
                    .then((dynamicLink) => navigator.clipboard.writeText(dynamicLink));
                this.$toastr.s({
                    title: 'Thành công!',
                    msg: 'Đã sao chép link',
                });
            } else {
                this.$toastr.e({
                    title: 'Thất bại!',
                    msg: 'Sao chép đường dẫn không thành công. Kiểm tra lại thông tin phòng',
                });
            }
        },

        toastCreateError() {
            this.$toastr.e({
                title: 'Thất bại!',
                msg: 'Đã có lỗi xảy ra, vui lòng kiểm tra lại thông tin',
            });
        },

        toastCreateSuccess() {
            this.$toastr.s({
                title: 'Thành công!',
                msg: 'Thao tác thành công!',
            });
        },

        async fetchSession() {
            try {
                const response = await this.$api.get('/Zoom/sessions');
                this.sessionData = response.sessions;
                const matchingSession = this.sessionData.find(
                    (session) => session.session_name == this.topic,
                );
                if (matchingSession) {
                    if (!matchingSession.has_recording) {
                        this.recordingCloud(matchingSession.id);
                    } else {
                        console.log('Recording has already been started or not found');
                    }
                } else {
                    await this.fetchSession();
                }
            } catch (error) {
                console.error('Failed to fetch session data', error);
            }
        },

        async recordingCloud(sessionId) {
            let encodedSessionId = encodeURIComponent(sessionId);
            try {
                const response = await this.$api.patch(
                    `/Zoom/startRecording?sessionId=${encodedSessionId}`,
                );
                if (response.status === 200) {
                    console.log('Recording started successfully');
                } else {
                    console.log(`Failed to start recording. Status: ${response.status}`);
                }
            } catch (error) {
                this.$toastr.e({
                    title: 'Lỗi !',
                    msg: error.message,
                });
            }
        },

        async initSession() {
            if (this.topic === '' || this.user_identity === '') {
                this.toastCreateError();
                return;
            }

            try {
                const sessionConfig = await getConfig(
                    this.topic,
                    this.password,
                    this.user_identity,
                );

                this.sessionToken = await generateSessionToken(
                    sessionConfig.sdkKey,
                    sessionConfig.sdkSecret,
                    sessionConfig.topic,
                    sessionConfig.user_identity,
                    sessionConfig.sessionKey,
                    sessionConfig.password,
                    parseInt(this.role, 10),
                    '', // cloudRecordingOption
                    '', // cloudRecordingElection
                    uuidv4() // userUniqueId
                );

                this.isButtonDisabled = true;
                this.isButtonRecording = true;
                await this.joinZoomSession();

                // Apply fullscreen after joining
                setTimeout(() => {
                    this.enforceFullscreen();
                }, 1000);

            } catch (error) {
                console.error('Session initialization error:', error);
                this.toastCreateError();
            }
        },

        sessionClosed() {
            if (window.confirm('Are you sure you want to exit the session?')) {
                this.sessionContainer = document.getElementById('sessionContainer');
                this.isButtonDisabled = false;
                this.isButtonRecording = false;
                this.topic = '';
                this.user_identity = '';
                uitoolkit.closeSession(this.sessionContainer);
            }
        },

        joinZoomSession() {
            this.sessionContainer = document.getElementById('sessionContainer');

            var config = {
                videoSDKJWT: this.sessionToken,
                sessionName: this.topic,
                userName: this.user_identity,
                sessionPasscode: this.password,
                features: [
                    'preview',
                    'video',
                    'audio',
                    'share',
                    'chat',
                    'users',
                    'settings',
                    'recording',
                    'phone',
                    'invite',
                    'theme',
                    'viewMode',
                    'feedback',
                    'troubleshoot',
                    'caption',
                    'playback',
                    'subsession',
                    'leave',
                    'virtualBackground',
                    'footer',
                    'header',
                ],
                meetingInfo: {
                    disableFullscreen: true, // Prevent zoom's own fullscreen
                    disableZoom: true, // Prevent zoom in/out
                    fitMode: 'fit' // Use 'fit' to ensure content is visible without scrolling
                }
            };

            if (this.role == 0) {
                config.features = ['video', 'audio', 'chat', 'users'];
            }

            uitoolkit.joinSession(this.sessionContainer, config);
        },
    },
};
</script>

<style scoped>
.perfect-fit-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    /* background-color: #000; */
}

.perfect-fit-session {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 10;
    margin-bottom: 30px;
    background-image: url('./media/bg-img.jpg');
    background-size: contain;
}

/* Floating controls */
.floating-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    gap: 10px;
}

.control-button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: bold;
    opacity: 0.7;
    transition: opacity 0.3s;
}

.control-button:hover {
    opacity: 1;
}

.copy-button {
    background-color: #1e96c8;
    color: white;
}

.exit-button {
    background-color: #f44336;
    color: white;
}

.formRegister {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 20;
    width: 100%;
    max-width: 500px;
}

.error {
    color: red;
    margin-left: 5px;
}

.btnCreateSession {

    width: 60%;
    background-image: linear-gradient(-180deg, #37aee2 0%, #1e96c8 100%);
    border: none;
    border-radius: 0.5rem;
    color: #ffffff;
    font-size: 16px;
    text-decoration: none;
    cursor: pointer;
    padding: 10px 15px;
    text-align: center;
    display: inline-block;
}

.form-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background-color: white;
}

.form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
}

.form-group label {
    margin-bottom: 5px;
    font-weight: bold;
}

.form-group input {
    padding: 5px;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 15px;
}

.textheader {
    text-align: center;
    font-size: 35px;
    font-weight: bold;
    margin-bottom: 10px;
}

.selected {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
}

/* Apply global style overrides for Zoom UI */
:deep(.zm-video),
:deep(.zm-grid),
:deep(.zm-meeting),
:deep(.zm-participants),
:deep(.zm-canvas),
:deep(.zm-video-frame),
:deep(.zm-video-container) {
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    overflow: hidden !important;
}

/* Prevent scrollbars on various containers */
:deep(.zm-scrollbar) {
    overflow: hidden !important;
}

/* Fix potential content overflow */
:deep(body),
:deep(html) {
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
}

/* Make sure controls stay visible */
:deep(.zm-btn) {
    z-index: 1000 !important;
}

.label {
    text-align: left;
}
</style>
