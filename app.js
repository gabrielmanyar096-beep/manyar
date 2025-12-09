// Chat Application - Complete with Link Sharing
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.currentRoom = null;
        this.rooms = new Map(); // Store rooms: id -> {name, users, messages}
        this.users = new Map(); // Store users: id -> {name, email}
        
        this.init();
    }
    
    init() {
        this.checkAuthState();
        this.setupEventListeners();
        this.loadFromLocalStorage();
        
        // Check if we're on chat page and need to load room from URL
        if (window.location.pathname.includes('chat.html')) {
            this.loadRoomFromURL();
        }
    }
    
    // Generate a unique room ID (for shareable links)
    generateRoomId() {
        return 'room_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    }
    
    // Generate a shareable link for the current room
    generateShareableLink(roomId = this.currentRoom) {
        if (!roomId) return '';
        
        // Get current URL without query parameters
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', 'chat.html');
        
        // Create the shareable link with room ID
        const shareableLink = `${baseUrl}?room=${encodeURIComponent(roomId)}`;
        return shareableLink;
    }
    
    // Load room from URL parameters
    loadRoomFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        
        if (roomId) {
            this.joinRoom(roomId);
        } else {
            // Create a new room if no room ID in URL
            this.createNewRoom();
        }
    }
    
    // Create a new chat room
    createNewRoom(roomName = 'New Chat Room') {
        const roomId = this.generateRoomId();
        const room = {
            id: roomId,
            name: roomName,
            creator: this.currentUser?.id || 'anonymous',
            createdAt: new Date().toISOString(),
            users: new Set([this.currentUser?.id]),
            messages: []
        };
        
        this.rooms.set(roomId, room);
        this.currentRoom = roomId;
        
        // Update UI
        this.updateRoomUI(room);
        
        // Generate and display shareable link
        this.updateShareableLink();
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Show notification
        this.showNotification(`New room "${roomName}" created!`);
        
        return roomId;
    }
    
    // Join an existing room
    joinRoom(roomId) {
        let room = this.rooms.get(roomId);
        
        if (!room) {
            // Create room if it doesn't exist
            room = {
                id: roomId,
                name: `Room: ${roomId.substring(0, 8)}`,
                creator: 'unknown',
                createdAt: new Date().toISOString(),
                users: new Set(),
                messages: []
            };
            this.rooms.set(roomId, room);
        }
        
        // Add current user to room
        if (this.currentUser?.id) {
            room.users.add(this.currentUser.id);
        }
        
        this.currentRoom = roomId;
        
        // Update UI
        this.updateRoomUI(room);
        
        // Generate and display shareable link
        this.updateShareableLink();
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Show welcome message
        this.addSystemMessage(`You joined the room. ${room.users.size} user(s) here.`);
        
        this.showNotification(`Joined room: ${room.name}`);
    }
    
    // Update room information in UI
    updateRoomUI(room) {
        // Update room name display
        const roomNameElement = document.getElementById('room-name');
        if (roomNameElement) {
            roomNameElement.textContent = room.name;
        }
        
        // Update room ID display
        const roomIdElement = document.getElementById('room-id-display');
        if (roomIdElement) {
            roomIdElement.textContent = `ID: ${room.id.substring(0, 12)}...`;
        }
        
        // Update room creation time
        const roomTimeElement = document.getElementById('room-created-time');
        if (roomTimeElement) {
            const createdDate = new Date(room.createdAt);
            roomTimeElement.textContent = createdDate.toLocaleString();
        }
        
        // Update participants list
        this.updateParticipantsList(room);
    }
    
    // Update the shareable link in UI
    updateShareableLink() {
        const shareableLink = this.generateShareableLink();
        
        // Update in header
        const linkInput = document.getElementById('shareable-link');
        if (linkInput) {
            linkInput.value = shareableLink;
        }
        
        // Update in modal
        const modalLinkInput = document.getElementById('modal-share-link');
        if (modalLinkInput) {
            modalLinkInput.value = shareableLink;
        }
        
        // Generate QR code
        this.generateQRCode(shareableLink);
    }
    
    // Generate QR code for sharing
    generateQRCode(link) {
        const qrContainer = document.getElementById('qr-code-container');
        if (!qrContainer) return;
        
        qrContainer.innerHTML = '';
        
        try {
            QRCode.toCanvas(link, { 
                width: 200, 
                height: 200,
                margin: 2,
                color: {
                    dark: '#667eea',
                    light: '#ffffff'
                }
            }, function(error, canvas) {
                if (error) {
                    console.error('QR Code generation error:', error);
                    qrContainer.innerHTML = `
                        <div class="qr-placeholder">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>QR Code unavailable</p>
                        </div>
                    `;
                } else {
                    qrContainer.appendChild(canvas);
                }
            });
        } catch (error) {
            console.error('QR Code error:', error);
        }
    }
    
    // Update participants list
    updateParticipantsList(room) {
        const participantsList = document.getElementById('participants-list');
        const onlineCount = document.getElementById('online-count');
        
        if (!participantsList || !onlineCount) return;
        
        participantsList.innerHTML = '';
        
        // Add current user first
        if (this.currentUser) {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-user-circle"></i> ${this.currentUser.name} (You)`;
            participantsList.appendChild(li);
        }
        
        // Update online count
        onlineCount.textContent = room.users.size;
    }
    
    // Send a message
    sendMessage(text) {
        if (!text.trim() || !this.currentRoom || !this.currentUser) return;
        
        const message = {
            id: 'msg_' + Date.now(),
            text: text,
            sender: this.currentUser.id,
            senderName: this.currentUser.name,
            timestamp: new Date().toISOString(),
            type: 'text'
        };
        
        // Add to room messages
        const room = this.rooms.get(this.currentRoom);
        if (room) {
            room.messages.push(message);
            
            // Display message
            this.displayMessage(message);
            
            // Save to localStorage
            this.saveToLocalStorage();
            
            // Clear input
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = '';
                messageInput.style.height = 'auto';
            }
            
            // Scroll to bottom
            this.scrollToBottom();
        }
    }
    
    // Send a photo
    sendPhoto(file) {
        if (!file || !this.currentRoom || !this.currentUser) return;
        
        // Create a preview URL for the image
        const reader = new FileReader();
        reader.onload = (e) => {
            const message = {
                id: 'img_' + Date.now(),
                imageUrl: e.target.result,
                sender: this.currentUser.id,
                senderName: this.currentUser.name,
                timestamp: new Date().toISOString(),
                type: 'image'
            };
            
            // Add to room messages
            const room = this.rooms.get(this.currentRoom);
            if (room) {
                room.messages.push(message);
                
                // Display message with image
                this.displayMessage(message);
                
                // Save to localStorage
                this.saveToLocalStorage();
                
                // Scroll to bottom
                this.scrollToBottom();
                
                this.showNotification('Photo sent!');
            }
        };
        reader.readAsDataURL(file);
    }
    
    // Display a message in chat
    displayMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === this.currentUser?.id ? 'user' : 'other'}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (message.type === 'text') {
            messageElement.innerHTML = `
                <div class="message-content">
                    <strong>${message.senderName}</strong>
                    <p>${this.escapeHtml(message.text)}</p>
                    <span class="small">${time}</span>
                </div>
            `;
        } else if (message.type === 'image') {
            messageElement.innerHTML = `
                <div class="message-content">
                    <strong>${message.senderName}</strong>
                    <img src="${message.imageUrl}" alt="Sent photo">
                    <p class="small">${time}</p>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageElement);
    }
    
    // Add system message
    addSystemMessage(text) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message system';
        messageElement.innerHTML = `
            <div class="message-content">
                <p><i class="fas fa-info-circle"></i> ${text}</p>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Scroll chat to bottom
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // Show notification
    showNotification(text, duration = 3000) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (notification && notificationText) {
            notificationText.textContent = text;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, duration);
        } else {
            // Fallback to alert if notification element doesn't exist
            alert(text);
        }
    }
    
    // Copy link to clipboard
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Link copied to clipboard!');
        });
    }
    
    // Share via social media
    shareViaWhatsApp(link) {
        const text = `Join me in our chat room: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    
    shareViaTelegram(link) {
        const text = `Join me in our chat room: ${link}`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Join our chat!')}`, '_blank');
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Authentication forms
        this.setupAuthForms();
        
        // Chat page events
        if (window.location.pathname.includes('chat.html')) {
            this.setupChatEvents();
        }
    }
    
    setupAuthForms() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const authForms = document.querySelectorAll('.auth-form');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding form
                authForms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${tab}-form`) {
                        form.classList.add('active');
                    }
                });
            });
        });
        
        // Registration form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const username = document.getElementById('reg-username').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                
                this.registerUser(username, email, password);
            });
        }
        
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                this.loginUser(email, password);
            });
        }
        
        // Create room button
        const createRoomBtn = document.getElementById('create-room-btn');
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    const roomId = this.createNewRoom(`Room with ${this.currentUser.name}`);
                    // Redirect to chat page with new room
                    window.location.href = `chat.html?room=${encodeURIComponent(roomId)}`;
                } else {
                    this.showNotification('Please register or login first!');
                }
            });
        }
        
        // Join room button
        const joinRoomBtn = document.getElementById('join-room-btn');
        if (joinRoomBtn) {
            joinRoomBtn.addEventListener('click', () => {
                const linkInput = document.getElementById('room-link-input');
                if (linkInput && linkInput.value) {
                    // Extract room ID from link
                    const url = new URL(linkInput.value);
                    const roomId = url.searchParams.get('room');
                    if (roomId) {
                        window.location.href = `chat.html?room=${encodeURIComponent(roomId)}`;
                    } else {
                        this.showNotification('Invalid room link!');
                    }
                } else {
                    this.showNotification('Please paste a room link first!');
                }
            });
        }
    }
    
    setupChatEvents() {
        // Send message button
        const sendBtn = document.getElementById('send-message-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const messageInput = document.getElementById('message-input');
                if (messageInput && messageInput.value.trim()) {
                    this.sendMessage(messageInput.value);
                }
            });
        }
        
        // Message input (Enter to send)
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (messageInput.value.trim()) {
                        this.sendMessage(messageInput.value);
                    }
                }
            });
            
            // Auto-resize textarea
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
        
        // Copy link button
        const copyLinkBtn = document.getElementById('copy-link-btn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                const link = document.getElementById('shareable-link').value;
                this.copyToClipboard(link);
            });
        }
        
        // Modal copy link button
        const modalCopyBtn = document.getElementById('modal-copy-btn');
        if (modalCopyBtn) {
            modalCopyBtn.addEventListener('click', () => {
                const link = document.getElementById('modal-share-link').value;
                this.copyToClipboard(link);
            });
        }
        
        // Share via WhatsApp button
        const shareWhatsappBtn = document.getElementById('share-whatsapp-btn');
        if (shareWhatsappBtn) {
            shareWhatsappBtn.addEventListener('click', () => {
                const link = document.getElementById('shareable-link').value;
                this.shareViaWhatsApp(link);
            });
        }
        
        // Share via Telegram button
        const shareTelegramBtn = document.getElementById('share-telegram-btn');
        if (shareTelegramBtn) {
            shareTelegramBtn.addEventListener('click', () => {
                const link = document.getElementById('shareable-link').value;
                this.shareViaTelegram(link);
            });
        }
        
        // Invite friends button
        const inviteBtn = document.getElementById('invite-friends-btn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => {
                this.openInviteModal();
            });
        }
        
        // Close modal button
        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeInviteModal();
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // Photo upload
        const photoUpload = document.getElementById('photo-upload');
        const photoBtn = document.getElementById('photo-btn');
        
        if (photoBtn && photoUpload) {
            photoBtn.addEventListener('click', () => {
                photoUpload.click();
            });
            
            photoUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.sendPhoto(file);
                    photoUpload.value = ''; // Reset input
                } else {
                    this.showNotification('Please select an image file!');
                }
            });
        }
        
        // Clear chat button
        const clearChatBtn = document.getElementById('clear-chat-btn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all messages in this room?')) {
                    this.clearChat();
                }
            });
        }
        
        // New room button
        const newRoomBtn = document.getElementById('new-room-btn');
        if (newRoomBtn) {
            newRoomBtn.addEventListener('click', () => {
                const roomId = this.createNewRoom(`New Room by ${this.currentUser.name}`);
                this.showNotification(`New room created! Share the link to invite others.`);
            });
        }
        
        // Share method buttons in modal
        document.querySelectorAll('.share-method-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const link = document.getElementById('modal-share-link').value;
                
                if (btn.classList.contains('whatsapp')) {
                    this.shareViaWhatsApp(link);
                } else if (btn.classList.contains('telegram')) {
                    this.shareViaTelegram(link);
                } else if (btn.classList.contains('email')) {
                    window.location.href = `mailto:?subject=Join my chat room&body=Join me in our chat room: ${encodeURIComponent(link)}`;
                } else if (btn.classList.contains('sms')) {
                    window.location.href = `sms:?&body=Join me in our chat room: ${encodeURIComponent(link)}`;
                }
            });
        });
    }
    
    // Open invite modal
    openInviteModal() {
        const modal = document.getElementById('invite-modal');
        if (modal) {
            modal.classList.add('show');
            this.updateShareableLink(); // Ensure link is updated
        }
    }
    
    // Close invite modal
    closeInviteModal() {
        const modal = document.getElementById('invite-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    // Register user
    registerUser(username, email, password) {
        // Simple validation
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters!');
            return;
        }
        
        // Create user object
        const userId = 'user_' + Date.now();
        this.currentUser = {
            id: userId,
            name: username,
            email: email,
            registeredAt: new Date().toISOString()
        };
        
        // Store user
        this.users.set(userId, this.currentUser);
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        this.showNotification(`Welcome ${username}! Account created.`);
        
        // Create a new room and redirect
        setTimeout(() => {
            const roomId = this.createNewRoom(`${username}'s Chat Room`);
            window.location.href = `chat.html?room=${encodeURIComponent(roomId)}`;
        }, 1000);
    }
    
    // Login user
    loginUser(email, password) {
        // For demo purposes, we'll create a user if none exists
        // In a real app, you would verify credentials against a database
        
        const userId = 'user_' + Date.now();
        const username = email.split('@')[0];
        
        this.currentUser = {
            id: userId,
            name: username,
            email: email,
            loggedInAt: new Date().toISOString()
        };
        
        this.users.set(userId, this.currentUser);
        this.saveToLocalStorage();
        
        this.showNotification(`Welcome back ${username}!`);
        
        // Redirect to chat page
        setTimeout(() => {
            window.location.href = `chat.html`;
        }, 1000);
    }
    
    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.currentUser = null;
            localStorage.removeItem('chatAppUser');
            window.location.href = 'index.html';
        }
    }
    
    // Clear chat
    clearChat() {
        const room = this.rooms.get(this.currentRoom);
        if (room) {
            room.messages = [];
            
            // Clear UI
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="message system">
                        <div class="message-content">
                            <p><i class="fas fa-trash"></i> Chat cleared</p>
                            <p class="small">All messages have been removed</p>
                        </div>
                    </div>
                `;
            }
            
            this.saveToLocalStorage();
            this.showNotification('Chat cleared!');
        }
    }
    
    // Check authentication state
    checkAuthState() {
        // For demo, check localStorage
        const savedUser = localStorage.getItem('chatAppUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        // If on chat page but not logged in, redirect to index
        if (window.location.pathname.includes('chat.html') && !this.currentUser) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
    
    // Save to localStorage
    saveToLocalStorage() {
        try {
            // Save user
            if (this.currentUser) {
                localStorage.setItem('chatAppUser', JSON.stringify(this.currentUser));
            }
            
            // Save rooms (convert Sets to Arrays for JSON)
            const roomsData = {};
            this.rooms.forEach((room, id) => {
                roomsData[id] = {
                    ...room,
                    users: Array.from(room.users),
                    messages: room.messages
                };
            });
            
            localStorage.setItem('chatAppRooms', JSON.stringify(roomsData));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }
    
    // Load from localStorage
    loadFromLocalStorage() {
        try {
            // Load rooms
            const roomsData = localStorage.getItem('chatAppRooms');
            if (roomsData) {
                const parsed = JSON.parse(roomsData);
                Object.entries(parsed).forEach(([id, room]) => {
                    this.rooms.set(id, {
                        ...room,
                        users: new Set(room.users),
                        messages: room.messages || []
                    });
                });
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});