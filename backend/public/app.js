const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
    window.location.href = '/login';
} else {
    const avatarEl = document.getElementById('userAvatar');
    if (user.avatarUrl) {
        avatarEl.innerHTML = `<img src="/${user.avatarUrl.replace(/\\/g, '/')}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        avatarEl.textContent = user.username.charAt(0).toUpperCase();
    }
}

function renderUserAvatarBaru(userData) {
    const avatarEl = document.getElementById('userAvatar');
    document.getElementById('topbarName').textContent = userData.username;
    
    if (userData.avatarUrl) {
        avatarEl.innerHTML = `<img src="/${userData.avatarUrl.replace(/\\/g, '/')}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        avatarEl.textContent = userData.username.charAt(0).toUpperCase();
    }
}
if (user) renderUserAvatarBaru(user);

const notesContainer = document.getElementById('notesContainer');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');

const navNotes = document.getElementById('navNotes');
const navFolders = document.getElementById('navFolders');
const navCollabs = document.getElementById('navCollabs'); 
const navTags = document.getElementById('navTags');
const navActivities = document.getElementById('navActivities');
const navAdminDashboard = document.getElementById('navAdminDashboard');
const navUserControl = document.getElementById('navUserControl');
const navBulletin = document.getElementById('navBulletin');

navAdminDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    currentView = 'admin_dashboard';
    setActiveNav(navAdminDashboard);
    renderAdminDashboard();
});

navUserControl.addEventListener('click', (e) => {
    e.preventDefault();
    currentView = 'user_control';
    setActiveNav(navUserControl);
    fetchAdminData();
});

navBulletin.addEventListener('click', (e) => {
    e.preventDefault();
    currentView = 'bulletin_management';
    setActiveNav(navBulletin);
    fetchAdminData();
});

const noteModal = document.getElementById('noteModal');
const noteForm = document.getElementById('noteForm');
const cancelNoteBtn = document.getElementById('cancelNoteBtn');
const noteFolderDropdown = document.getElementById('noteFolder');

const folderModal = document.getElementById('folderModal');
const folderForm = document.getElementById('folderForm');
const cancelFolderBtn = document.getElementById('cancelFolderBtn');

const collabModal = document.getElementById('collabModal'); 
const collabForm = document.getElementById('collabForm'); 
const cancelCollabBtn = document.getElementById('cancelCollabBtn'); 

const tagModal = document.getElementById('tagModal');
const tagForm = document.getElementById('tagForm');
const cancelTagBtn = document.getElementById('cancelTagBtn');

const bulletinModal = document.getElementById('bulletinModal');
const bulletinForm = document.getElementById('bulletinForm');
const cancelBulletinBtn = document.getElementById('cancelBulletinBtn');

let allNotes = [];
let allFolders = [];
let allCollabs = []; 
let allTags = [];
let allActivities = [];
let allUsers = [];
let allBulletins = [];

let currentView = 'notes';
let editingNoteId = null;
let editingFolderId = null;
let editingTagId = null;
let editingCollabId = null;
let editingBulletinId = null;

let noteCurrentPage = 1;
let noteTotalPages = 1;

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `memoora-toast toast-${type}`;
    toast.innerHTML = type === 'success' ? `${message}` : `${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

function setActiveNav(activeElement) {
    document.querySelectorAll('.nav-link').forEach(el => { 
        el.classList.remove('active', 'text-gold');
        el.classList.add('text-secondary'); 
        el.style.borderLeft = "none";
    });
    if(activeElement) {
        activeElement.classList.add('active', 'text-gold');
        activeElement.classList.remove('text-secondary');
        activeElement.style.borderLeft = "4px solid #f39c12";
    }

    if (currentView !== 'notes') {
        const pagContainer = document.getElementById('paginationContainer');
        if (pagContainer) pagContainer.innerHTML = '';
    }

    const isUserAdmin = user && user.role === 'admin';
    const statusFilter = document.getElementById('statusFilter');
    
    if (statusFilter) {
        if (currentView === 'notes' && !isUserAdmin) {
            statusFilter.classList.remove('d-none');
            statusFilter.classList.add('d-md-block');
        } else {
            statusFilter.classList.remove('d-md-block');
            statusFilter.classList.add('d-none');
        }
    }

    const mainAddBtn = document.getElementById('addNoteBtn');
    if (mainAddBtn) {
        if (isUserAdmin) {
            if (currentView === 'bulletin_management') { mainAddBtn.textContent = 'Buletin Baru'; mainAddBtn.style.display = 'block'; }
            else { mainAddBtn.style.display = 'none'; }
        } else {
            if (currentView === 'notes') { mainAddBtn.textContent = 'Catatan Baru'; mainAddBtn.style.display = 'block'; }
            else if (currentView === 'folders') { mainAddBtn.textContent = 'Folder Baru'; mainAddBtn.style.display = 'block'; }
            else if (currentView === 'collabs') { mainAddBtn.textContent = 'Undang Teman'; mainAddBtn.style.display = 'block'; }
            else if (currentView === 'tags') { mainAddBtn.textContent = 'Tag Baru'; mainAddBtn.style.display = 'block'; }
            else if (currentView === 'activities') { mainAddBtn.style.display = 'none'; }
        }
    }

    const bulletinWidget = document.getElementById('bulletinWidget');
    if (bulletinWidget) {
        bulletinWidget.style.display = (currentView === 'notes' && !isUserAdmin) ? 'block' : 'none';
    }
}

async function logActivity(actionName, descriptionText) {
    try {
        await fetch('http://localhost:3000/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action: actionName, description: descriptionText })
        });
    } catch (error) { 
        console.error(error); 
    }
}

navNotes.addEventListener('click', (e) => {
    e.preventDefault();
    currentView = 'notes';
    setActiveNav(navNotes);
    searchInput.placeholder = 'Cari catatan...';
    notesContainer.innerHTML = '<div class="col-12 text-center text-secondary mt-5">Memuat catatan...</div>';
    fetchNotes();
    fetchBulletinWidget();
});

navFolders.addEventListener('click', (e) => {
    e.preventDefault();
    currentView = 'folders';
    setActiveNav(navFolders);
    searchInput.placeholder = 'Cari folder...';
    notesContainer.innerHTML = '<div class="col-12 text-center text-secondary mt-5">Memuat folder...</div>';
    fetchFolders();
});

navCollabs.addEventListener('click', (e) => {
    e.preventDefault();
    currentView = 'collabs';
    setActiveNav(navCollabs);
    searchInput.placeholder = 'Cari email...';
    notesContainer.innerHTML = '<div class="col-12 text-center text-secondary mt-5">Memuat kolaborator...</div>';
    fetchCollabs();
});

if (navTags) {
    navTags.addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'tags';
        setActiveNav(navTags);
        searchInput.placeholder = 'Cari tag...';
        notesContainer.innerHTML = '<div class="col-12 text-center text-secondary mt-5">Memuat Tags...</div>';
        fetchTags();
    });
}

if (navActivities) {
    navActivities.addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'activities';
        setActiveNav(navActivities);
        searchInput.placeholder = 'Cari aktivitas...';
        notesContainer.innerHTML = '<div class="col-12 text-center text-secondary mt-5">Memuat Riwayat Aktivitas...</div>';
        fetchActivities();
    });
}

function jalankanFilter() {
    const kataKunci = searchInput.value.toLowerCase();
    if (currentView === 'notes') {
        fetchNotes(1); 
    } else if (currentView === 'folders') {
        const dataTersaring = allFolders.filter(folder => folder.name.toLowerCase().includes(kataKunci));
        renderFoldersTemplate(dataTersaring);
    } else if (currentView === 'collabs') {
        const dataTersaring = allCollabs.filter(collab => collab.email.toLowerCase().includes(kataKunci));
        renderCollabsTemplate(dataTersaring);
    } else if (currentView === 'tags') {
        const dataTersaring = allTags.filter(tag => tag.name.toLowerCase().includes(kataKunci));
        renderTags(dataTersaring);
    } else if (currentView === 'activities') {
        const dataTersaring = allActivities.filter(act => act.action.toLowerCase().includes(kataKunci) || (act.description && act.description.toLowerCase().includes(kataKunci)));
        renderActivities(dataTersaring);
    } else if (currentView === 'user_control') {
        const usersTersaring = allUsers.filter(u => u.username.toLowerCase().includes(kataKunci));
        renderUserControl(usersTersaring);
    } else if (currentView === 'bulletin_management') {
        const bulletinsTersaring = allBulletins.filter(b => b.title.toLowerCase().includes(kataKunci));
        renderBulletinManagement(bulletinsTersaring);
    }
}

searchInput.addEventListener('input', jalankanFilter);
if(statusFilter) statusFilter.addEventListener('change', jalankanFilter);

async function fetchFolders() {
    try {
        const response = await fetch('http://localhost:3000/api/folders', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await response.json();
        if (result.success) {
            allFolders = result.data;
            updateFolderDropdown(); 
            if (currentView === 'folders') jalankanFilter();
        }
    } catch (error) { 
        console.error(error); 
    }
}

function updateFolderDropdown() {
    if(!noteFolderDropdown) return;
    noteFolderDropdown.innerHTML = '<option value="">Pilih Folder (Opsional)</option>';
    allFolders.forEach(folder => {
        noteFolderDropdown.innerHTML += `<option value="${folder.id}">${folder.name}</option>`;
    });
}

function renderFoldersTemplate(folders) {
    if (currentView !== 'folders') return;
    notesContainer.innerHTML = '';
    if (folders.length === 0) return notesContainer.innerHTML = `<div class="col-12 text-center mt-5 pt-5"><h1 style="font-size: 4rem; opacity: 0.3;">📁</h1><h5 class="text-gold mt-3">Belum ada folder</h5></div>`;
    
    folders.forEach(folder => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6 mb-4';
        card.innerHTML = `
            <div class="card bg-dark border-secondary shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0 text-gold fw-bold">📁 ${folder.name}</h5>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-sm btn-outline-warning edit-folder-btn fw-bold" data-id="${folder.id}" data-name="${folder.name}">Edit</button>
                            <button class="btn btn-sm btn-outline-danger delete-folder-btn fw-bold" data-id="${folder.id}">Hapus</button>
                        </div>
                    </div>
                </div>
            </div>`;
        notesContainer.appendChild(card);
    });
}

async function fetchBulletins() {
    const bulletinList = document.getElementById('bulletinList');
    try {
        const response = await fetch('http://localhost:3000/api/bulletins?limit=5', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await response.json();

        if (result.success) {
            allBulletins = result.data;
            renderBulletins(allBulletins);
        } else if (bulletinList) {
            bulletinList.innerHTML = `<div class="text-center text-secondary py-3">Belum ada pengumuman.</div>`;
        }
    } catch (error) {
        console.error(error);
        if (bulletinList) {
            bulletinList.innerHTML = `<div class="text-center text-secondary py-3">Gagal memuat pengumuman.</div>`;
        }
    }
}

function formatBulletinDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function renderBulletins(bulletins) {
    const bulletinList = document.getElementById('bulletinList');
    if (!bulletinList) return;

    if (!bulletins || bulletins.length === 0) {
        bulletinList.innerHTML = `<div class="text-center text-secondary py-3">📭 Belum ada pengumuman dari Admin.</div>`;
        return;
    }

    bulletinList.innerHTML = '';
    bulletins.forEach(bulletin => {
        const authorName = bulletin.author && bulletin.author.username ? bulletin.author.username : 'Admin';
        const content = bulletin.content || '';
        const preview = content.length > 140 ? content.substring(0, 140) + '...' : content;

        const item = document.createElement('div');
        item.className = 'p-3 rounded bulletin-item';
        item.style.borderLeft = '4px solid #c64d31';
        item.style.backgroundColor = 'rgba(198, 77, 49, 0.05)';
        item.style.cursor = 'pointer';
        item.setAttribute('data-id', bulletin.id);

        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <h6 class="text-light fw-bold mb-1">${bulletin.title}</h6>
                <small class="text-secondary text-nowrap">${formatBulletinDate(bulletin.createdAt)}</small>
            </div>
            <p class="text-secondary mb-1" style="font-size: 0.9rem;">${preview}</p>
            <small class="text-gold fw-bold">— ${authorName} &middot; Baca selengkapnya</small>
        `;

        item.addEventListener('click', () => openBulletinModal(bulletin));
        bulletinList.appendChild(item);
    });
}

function openBulletinModal(bulletin) {
    const modal = document.getElementById('bulletinModal');
    if (!modal) return;

    const authorName = bulletin.author && bulletin.author.username ? bulletin.author.username : 'Admin';

    document.getElementById('bulletinModalTitle').textContent = bulletin.title;
    document.getElementById('bulletinModalMeta').textContent = `Diposting oleh ${authorName} • ${formatBulletinDate(bulletin.createdAt)}`;
    document.getElementById('bulletinModalContent').textContent = bulletin.content || '';

    modal.style.display = 'flex';
}

const closeBulletinModalBtn = document.getElementById('closeBulletinModalBtn');
if (closeBulletinModalBtn) {
    closeBulletinModalBtn.addEventListener('click', () => {
        document.getElementById('bulletinModal').style.display = 'none';
    });
}

async function fetchNotes(page = 1) {
    try {
        const status = statusFilter ? statusFilter.value : 'all';
        const search = searchInput ? searchInput.value : '';
        let query = `?page=${page}&limit=6`;
        
        if (status && status !== 'all') query += `&status=${status}`;
        if (search) query += `&search=${search}`;

        const response = await fetch(`http://localhost:3000/api/notes${query}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await response.json();
        
        if (result.success) {
            allNotes = result.data;
            if (result.pagination) {
                noteCurrentPage = result.pagination.currentPage;
                noteTotalPages = result.pagination.totalPages;
            }
            
            if (currentView === 'notes') {
                renderNotesTemplate(allNotes);
                renderPagination();
            }
        }
    } catch (error) { 
        console.error(error); 
    }
}

function renderPagination() {
    const pagContainer = document.getElementById('paginationContainer');
    if (!pagContainer) return;

    if (currentView !== 'notes' || noteTotalPages <= 1) {
        pagContainer.innerHTML = '';
        return;
    }

    pagContainer.innerHTML = `
        <button class="btn btn-outline-warning fw-bold" onclick="fetchNotes(${noteCurrentPage - 1})" ${noteCurrentPage === 1 ? 'disabled' : ''}>&lt;</button>
        <span class="btn btn-dark text-warning border-secondary disabled">Hal ${noteCurrentPage} dari ${noteTotalPages}</span>
        <button class="btn btn-outline-warning fw-bold" onclick="fetchNotes(${noteCurrentPage + 1})" ${noteCurrentPage === noteTotalPages ? 'disabled' : ''}>&gt;</button>
    `;
}

function renderNotesTemplate(data) {
    if (currentView !== 'notes') return;

    notesContainer.innerHTML = '';

    if (data.length === 0) {
        notesContainer.innerHTML += `<div class="col-12 text-center text-secondary py-5">Belum ada catatan...</div>`;
    } else {
        data.forEach(note => {
            const isChecked = note.status === 'completed' ? 'checked' : '';
            const titleStyle = note.status === 'completed' ? 'text-decoration-line-through text-secondary' : 'text-light';
            
            let tagBg = 'transparent';
            let tagColor = '#f3ede3';
            let tagText = 'NO TAG';

            if (note.tag && note.tag !== '') {
                const matchingTag = allTags.find(t => t.id.toString() === note.tag.toString() || t.name.toLowerCase() === note.tag.toLowerCase());
                
                if (matchingTag) {
                    tagText = matchingTag.name.toUpperCase();
                    tagColor = matchingTag.color;
                    tagBg = matchingTag.color + '20'; 
                } else {
                    tagText = note.tag.toUpperCase();
                    tagColor = '#f39c12'; 
                    tagBg = 'rgba(243, 156, 18, 0.1)';
                }
            }

            const folderTerkait = allFolders.find(f => f.id === note.folderId);
            const namaFolderRender = folderTerkait ? `📁 ${folderTerkait.name}` : 'Tanpa Folder';

            let lampiranHtml = '';
            if (note.lampiran) {
                lampiranHtml = `<a href="/${note.lampiran.replace(/\\/g, '/')}" target="_blank" class="badge bg-info text-dark text-decoration-none mt-2" style="font-size: 0.8rem; padding: 5px 10px;">Lihat Lampiran</a>`;
            }

            const noteCard = document.createElement('div');
            noteCard.className = 'col-md-4 col-sm-6 mb-4';
            
            noteCard.innerHTML = `
                <div class="card h-100 bg-dark border-secondary shadow-sm">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-3">
                            <div class="d-flex gap-2 align-items-center">
                                <input class="form-check-input note-check fs-5 mt-0" type="checkbox" data-id="${note.id}" ${isChecked}>
                                <h5 class="card-title mb-0 ${titleStyle} fw-bold">${note.title}</h5>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-sm btn-outline-warning edit-note-btn fw-bold" 
                                        data-id="${note.id}" data-title="${note.title}" data-desc="${note.description || ''}"
                                        data-date="${note.dueDate || ''}" data-tag="${note.tag || ''}" data-folder="${note.folderId || ''}">Edit</button>
                                <button class="btn btn-sm btn-outline-danger delete-btn fw-bold" data-id="${note.id}">Hapus</button>
                            </div>
                        </div>
                        
                        <p class="card-text text-secondary flex-grow-1">${note.description || ''}</p>
                        
                        ${lampiranHtml}
                        
                        <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary">
                            <span class="badge" style="background-color: ${tagBg}; color: ${tagColor}; border: 1px solid ${tagColor};">${tagText}</span>
                            <small class="text-gold fw-bold">${namaFolderRender}</small>
                        </div>
                    </div>
                </div>`;
            notesContainer.appendChild(noteCard);
        });
    }
}

async function fetchCollabs() {
    try {
        const response = await fetch('http://localhost:3000/api/collabs', { headers: { 'Authorization': `Bearer ${token}` } }); 
        const result = await response.json();
        if (result.success) {
            allCollabs = result.data;
            if (currentView === 'collabs') jalankanFilter(); 
        }
    } catch (error) { 
        console.warn(error); 
    }
}

function renderCollabsTemplate(collabs) {
    if (currentView !== 'collabs') return;
    notesContainer.innerHTML = '';
    if (collabs.length === 0) return notesContainer.innerHTML = `<div class="col-12 text-center mt-5 pt-5"><h1 style="font-size: 4rem; opacity: 0.3;">🤝</h1><h5 class="text-gold mt-3">Belum ada kolaborator</h5></div>`;

    collabs.forEach(collab => {
        const roleBg = collab.role === 'editor' ? 'rgba(198, 77, 49, 0.1)' : 'rgba(30, 144, 255, 0.1)';
        const roleColor = collab.role === 'editor' ? '#c64d31' : '#1e90ff';
        const card = document.createElement('div');
        card.className = 'col-md-3 col-sm-6 mb-4';
        card.innerHTML = `
            <div class="card bg-dark border-secondary shadow-sm h-100">
                <div class="card-body d-flex flex-column align-items-center text-center">
                    <div class="rounded-circle bg-secondary d-flex justify-content-center align-items-center mb-3" style="width: 60px; height: 60px; font-size: 1.5rem;">👤</div>
                    <h6 class="card-title text-light fw-bold mb-1 w-100 text-truncate" title="${collab.email}">${collab.email}</h6>
                    <span class="badge mb-3" style="background-color: ${roleBg}; color: ${roleColor}; border: 1px solid ${roleColor};">${collab.role.toUpperCase()}</span>
                    
                    <div class="w-100 mt-auto d-flex flex-column gap-2">
                        <button class="btn btn-sm btn-outline-warning fw-bold w-100 edit-collab-btn" data-id="${collab.id}" data-email="${collab.email}" data-role="${collab.role}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger fw-bold w-100 delete-collab-btn" data-id="${collab.id}">Cabut Akses</button>
                    </div>
                </div>
            </div>`;
        notesContainer.appendChild(card);
    });
}

async function fetchTags() {
    try {
        const res = await fetch('http://localhost:3000/api/tags', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        if (result.success) { 
            allTags = result.data; 
            updateTagDropdown();
            if(currentView === 'tags') renderTags(allTags); 
        }
    } catch (error) { 
        console.error(error); 
    }
}

function renderTags(tags) {
    if (currentView !== 'tags') return;
    notesContainer.innerHTML = '';
    if (tags.length === 0) return notesContainer.innerHTML = `<div class="col-12 text-center mt-5 pt-5"><h1 style="font-size: 4rem; opacity: 0.3;">🏷️</h1><h5 class="text-gold mt-3">Belum ada Tag yang dibuat</h5></div>`;
    
    tags.forEach(tag => {
        const card = document.createElement('div');
        card.className = 'col-md-3 col-sm-6 mb-4';
        card.innerHTML = `
            <div class="card bg-dark border-secondary shadow-sm text-center p-4 h-100">
                <div class="mb-3" style="width: 50px; height: 50px; border-radius: 50%; background-color: ${tag.color}; margin: 0 auto; box-shadow: 0 0 15px ${tag.color}40;"></div>
                <h5 class="text-light fw-bold mb-4">${tag.name}</h5>
                <div class="mt-auto d-flex justify-content-center gap-2">
                    <button class="btn btn-sm btn-outline-warning edit-tag-btn" data-id="${tag.id}" data-name="${tag.name}" data-color="${tag.color}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-tag-btn" data-id="${tag.id}">Hapus</button>
                </div>
            </div>`;
        notesContainer.appendChild(card);
    });
}

function updateTagDropdown() {
    const noteTagSelect = document.getElementById('noteTag');
    if (!noteTagSelect) return;
    
    noteTagSelect.innerHTML = '<option value="">No Tag</option>';
    
    allTags.forEach(tag => {
        noteTagSelect.innerHTML += `<option value="${tag.id}" style="color: ${tag.color}; font-weight: bold;">${tag.name}</option>`;
    });
}

async function fetchActivities() {
    try {
        const res = await fetch('http://localhost:3000/api/activities', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        if (result.success) { 
            allActivities = result.data; 
            if(currentView === 'activities') renderActivities(allActivities); 
        }
    } catch (error) { 
        console.error(error); 
    }
}

function renderActivities(activities) {
    if (currentView !== 'activities') return;
    notesContainer.innerHTML = '';
    if (activities.length === 0) return notesContainer.innerHTML = `<div class="col-12 text-center mt-5 pt-5"><h1 style="font-size: 4rem; opacity: 0.3;">⏱️</h1><h5 class="text-gold mt-3">Belum ada riwayat aktivitas</h5></div>`;
    
    let html = '<div class="col-12"><div class="list-group">';
    activities.forEach(act => {
        const date = new Date(act.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
        html += `
            <div class="list-group-item bg-dark border-secondary text-light d-flex justify-content-between align-items-center mb-2 rounded shadow-sm">
                <div>
                    <h6 class="mb-1 text-gold fw-bold">${act.action}</h6>
                    <small class="text-secondary">${act.description || ''}</small>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <span class="badge bg-secondary rounded-pill">${date}</span>
                    <button class="btn btn-sm btn-outline-danger delete-activity-btn" data-id="${act.id}" title="Hapus Aktivitas">Hapus</button>
                </div>
            </div>`;
    });
    html += '</div></div>';
    notesContainer.innerHTML = html;
}

async function fetchAdminData() {
    try {
        const [usersRes, bulletinsRes] = await Promise.all([
            fetch('http://localhost:3000/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:3000/api/bulletins', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const usersResult = await usersRes.json();
        const bulletinsResult = await bulletinsRes.json();

        if (usersResult.success) allUsers = usersResult.data;
        if (bulletinsResult.success) allBulletins = bulletinsResult.data;

        if (currentView === 'user_control') renderUserControl(allUsers);
        if (currentView === 'bulletin_management') renderBulletinManagement(allBulletins);
    } catch (error) {
        console.error(error);
        if (currentView === 'admin') {
            notesContainer.innerHTML = '<div class="col-12 text-center text-danger mt-5">Gagal memuat data Admin Panel.</div>';
        }
    }
}

function renderAdminDashboard() {
    notesContainer.innerHTML = `
        <div class="col-12 text-center mt-5">
            <h1 class="text-gold fw-bold">Halo, Admin!</h1>
            <p class="text-light">Selamat datang di Panel Admin.</p>
        </div>`;
}

function renderUserControl(users) {
    if (currentView !== 'user_control') return;
    
    let html = `
        <div class="col-12">
            <h4 class="text-gold fw-bold mb-4">Manajemen User</h4>
            <div class="table-responsive">
                <table class="table table-dark table-hover table-bordered border-secondary align-middle">
                    <thead class="table-active">
                        <tr class="text-gold text-center">
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Limit Kolab Terpakai</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if (users.length === 0) {
        html += `<tr><td colspan="6" class="text-center text-secondary py-4">Tidak ada data user.</td></tr>`;
    } else {
        users.forEach(u => {
            const isAdmin = u.role === 'admin';
            const roleBadge = isAdmin ? '<span class="badge bg-danger">Admin</span>' : '<span class="badge bg-primary">User</span>';
            
            const limitText = isAdmin ? '<span class="text-secondary fw-bold">-</span>' : `${u.collab_edit_count} / 3`;
            
            const disableBtn = (isAdmin || u.collab_edit_count === 0) ? 'disabled' : '';
            const btnStyle = isAdmin ? 'btn-outline-secondary' : 'btn-outline-warning';
            
            const resetAlert = u.reset_request ? '<span class="badge bg-warning text-dark ms-2 shadow-sm">Minta Reset⚠️</span>' : '';
            
            html += `
                <tr class="text-center">
                    <td class="text-secondary">${u.id}</td>
                    <td class="text-light fw-bold text-start">${u.username} ${resetAlert}</td>
                    <td class="text-light">${u.email}</td>
                    <td>${roleBadge}</td>
                    <td class="text-light">${limitText}</td>
                    <td>
                        <button class="btn btn-sm ${btnStyle} fw-bold reset-collab-btn" 
                                data-id="${u.id}" data-username="${u.username}" ${disableBtn}>
                            Reset Limit
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    html += `</tbody></table></div></div>`;
    notesContainer.innerHTML = html;
}

async function fetchBulletinWidget() {
    const widget = document.getElementById('bulletinWidget');
    if (!widget) return;
    try {
        const res = await fetch('http://localhost:3000/api/bulletins', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        if (result.success && result.data.length > 0) {
            const latest = result.data.slice(0, 3);
            let html = `<div class="card bg-dark border-secondary shadow-sm mb-2"><div class="card-body">
                <h5 class="text-gold fw-bold mb-3">📢Pengumuman Terbaru</h5>`;
            latest.forEach(b => {
                const date = b.createdAt ? new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                html += `
                    <div class="border-bottom border-secondary pb-2 mb-2">
                        <div class="d-flex justify-content-between align-items-start">
                            <strong class="text-light">${b.title}</strong>
                            <small class="text-secondary">${date}</small>
                        </div>
                        <p class="text-secondary mb-0 mt-1" style="white-space: pre-wrap;">${b.content}</p>
                    </div>`;
            });
            html += `</div></div>`;
            widget.innerHTML = html;
        } else {
            widget.innerHTML = '';
        }
    } catch (error) {
        console.error(error);
        widget.innerHTML = '';
    }
}

function renderBulletinManagement(bulletins) {
    if (currentView !== 'bulletin_management') return;
    
    notesContainer.innerHTML = '<div class="col-12 mb-3"><h4 class="text-gold fw-bold">Manajemen Buletin</h4></div>';
    
    if (bulletins.length === 0) {
        notesContainer.innerHTML += `<div class="col-12 text-center text-secondary py-5">Belum ada buletin yang diterbitkan.</div>`;
    } else {
        bulletins.forEach(b => {
            const date = new Date(b.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const authorName = b.author && b.author.username ? b.author.username : 'Admin';
            
            const card = document.createElement('div');
            card.className = 'col-md-6 mb-4';
            card.innerHTML = `
                <div class="card bg-dark border-secondary shadow-sm h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <h5 class="card-title text-gold fw-bold mb-0">${b.title}</h5>
                        </div>
                        <small class="text-secondary mb-3">Oleh: <span class="text-light">${authorName}</span> &middot; ${date}</small>
                        <p class="card-text text-light flex-grow-1" style="white-space: pre-wrap; font-size: 0.95rem;">${b.content}</p>
                        
                        <div class="mt-3 pt-3 border-top border-secondary d-flex justify-content-end gap-2">
                            <button class="btn btn-sm btn-outline-warning edit-bulletin-btn fw-bold" 
                                    data-id="${b.id}" data-title="${b.title}" data-content="${b.content}">
                                Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-bulletin-btn fw-bold" 
                                    data-id="${b.id}">
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>`;
            notesContainer.appendChild(card);
        });
    }
}

if(noteForm) noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('noteTitle').value);
    formData.append('description', document.getElementById('noteDesc').value);
    formData.append('dueDate', document.getElementById('noteDate').value);
    formData.append('tag', document.getElementById('noteTag').value);
    
    const folderId = document.getElementById('noteFolder').value;
    if (folderId) formData.append('folderId', folderId);
    
    const fileLampiran = document.getElementById('noteLampiran').files[0];
    if (fileLampiran) formData.append('lampiran', fileLampiran);

    try {
        const isEditing = editingNoteId !== null;
        const url = isEditing ? `/api/notes/${editingNoteId}` : '/api/notes';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, { 
            method, 
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData 
        });
        
        const result = await response.json();

        if (response.ok && result.success) {
            noteModal.style.display = 'none'; 
            noteForm.reset(); 
            editingNoteId = null; 
            fetchNotes(); 
            showToast("Catatan berhasil disimpan!", "success");
            logActivity(isEditing ? 'Update Catatan' : 'Buat Catatan', `Judul: ${formData.get('title')}`);
        } else {
            showToast(result.message || "Gagal menyimpan catatan", "error");
        }
    } catch (error) { 
        console.error(error); 
        showToast("Terjadi kesalahan pada server", "error");
    }
});

if(folderForm) folderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('folderName').value;
    try {
        const isEditing = editingFolderId !== null;
        const url = isEditing ? `http://localhost:3000/api/folders/${editingFolderId}` : `http://localhost:3000/api/folders`;
        const method = isEditing ? 'PUT' : 'POST';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name }) });
        
        folderModal.style.display = 'none'; folderForm.reset(); editingFolderId = null; fetchFolders(); fetchNotes(); showToast("Folder tersimpan!");
        logActivity(isEditing ? 'Update Folder' : 'Buat Folder', `Nama Folder: ${name}`); 
    } catch (error) { console.error(error); }
});

if(collabForm) collabForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { email: document.getElementById('collabEmail').value, role: document.getElementById('collabRole').value };
    try {
        const isEditing = editingCollabId !== null;
        const url = isEditing ? `http://localhost:3000/api/collabs/${editingCollabId}` : `http://localhost:3000/api/collabs`;        const method = isEditing ? 'PUT' : 'POST';
        const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) });
        const result = await response.json();
        
        if (result.success) {
            showToast(isEditing ? "Role berhasil diperbarui!" : "Berhasil mengundang kolaborator!", "success");
            collabModal.style.display = 'none'; collabForm.reset(); document.getElementById('collabEmail').readOnly = false; editingCollabId = null; fetchCollabs(); 
            logActivity(isEditing ? 'Update Kolaborator' : 'Undang Kolaborator', `Akses untuk: ${data.email} (${data.role})`);
        } else { showToast(result.message, "error"); }
    } catch (error) { showToast("Terjadi kesalahan koneksi ke server.", "error"); }
});

if(tagForm) tagForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { name: document.getElementById('tagName').value, color: document.getElementById('tagColor').value };
        const isEditing = editingTagId !== null;
        const url = isEditing ? `http://localhost:3000/api/tags/${editingTagId}` : '/api/tags';
        const method = isEditing ? 'PUT' : 'POST';
        try {
            await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) });
            tagModal.style.display = 'none'; tagForm.reset(); fetchTags(); showToast("Tag berhasil disimpan!", "success");
            logActivity(isEditing ? 'Update Tag' : 'Buat Tag', `Nama Tag: ${data.name}`);
        } catch (error) { showToast("Gagal menyimpan tag", "error"); }
});

if (bulletinForm) {
    bulletinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { title: document.getElementById('bulletinTitle').value, content: document.getElementById('bulletinContent').value };
        try {
            const isEditing = editingBulletinId !== null;
            const url = isEditing ? `http://localhost:3000/api/bulletins/${editingBulletinId}` : '/api/bulletins';
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) });
            const result = await response.json();

            if (result.success) {
                bulletinModal.style.display = 'none';
                bulletinForm.reset();
                editingBulletinId = null;
                await fetchAdminData();
                fetchBulletinWidget();
                showToast(result.message || "Buletin berhasil disimpan!", "success");
                logActivity(isEditing ? 'Update Buletin' : 'Buat Buletin', `Judul: ${data.title}`);
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan koneksi ke server.", "error");
        }
    });
}

if(cancelNoteBtn) cancelNoteBtn.addEventListener('click', () => { noteModal.style.display = 'none'; noteForm.reset(); editingNoteId = null; });
if(cancelFolderBtn) cancelFolderBtn.addEventListener('click', () => { folderModal.style.display = 'none'; folderForm.reset(); editingFolderId = null; });
if(cancelCollabBtn) cancelCollabBtn.addEventListener('click', () => { collabModal.style.display = 'none'; collabForm.reset(); document.getElementById('collabEmail').readOnly = false; editingCollabId = null; });
if(cancelTagBtn) cancelTagBtn.addEventListener('click', () => { tagModal.style.display = 'none'; tagForm.reset(); });
if(cancelBulletinBtn) cancelBulletinBtn.addEventListener('click', () => { bulletinModal.style.display = 'none'; bulletinForm.reset(); editingBulletinId = null; });

notesContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        if (confirm("Hapus catatan ini?")) { 
            await fetch(`http://localhost:3000/api/notes/${e.target.getAttribute('data-id')}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); 
            fetchNotes(); 
            logActivity('Hapus Catatan', 'Sebuah catatan telah dihapus');
        }
    }
    if (e.target.classList.contains('note-check')) {
        const statusBaru = e.target.checked ? 'completed' : 'pending';
        await fetch(`http://localhost:3000/api/notes/${e.target.getAttribute('data-id')}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: statusBaru }) });
        fetchNotes();
        logActivity('Ubah Status Catatan', `Status diubah menjadi: ${statusBaru}`);
    }
    if (e.target.classList.contains('edit-note-btn')) {
        editingNoteId = e.target.getAttribute('data-id'); 
        document.getElementById('noteTitle').value = e.target.getAttribute('data-title'); 
        document.getElementById('noteDesc').value = e.target.getAttribute('data-desc'); 
        document.getElementById('noteDate').value = e.target.getAttribute('data-date'); 
        document.getElementById('noteTag').value = e.target.getAttribute('data-tag'); 
        document.getElementById('noteFolder').value = e.target.getAttribute('data-folder'); 
        document.querySelector('#noteModal h4').textContent = "Edit Catatan"; 
        noteModal.style.display = 'flex';
    }

    if (e.target.classList.contains('delete-folder-btn')) {
        if (confirm("Hapus folder ini?")) {
            await fetch(`http://localhost:3000/api/folders/${e.target.getAttribute('data-id')}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); 
            fetchFolders(); 
            fetchNotes(); 
            showToast('Folder berhasil dihapus', 'success');
            logActivity('Hapus Folder', 'Sebuah folder dihapus');
        }
    }
    if (e.target.classList.contains('edit-folder-btn')) {
        editingFolderId = e.target.getAttribute('data-id'); 
        document.getElementById('folderName').value = e.target.getAttribute('data-name'); 
        const folderTitle = document.getElementById('folderModalTitle') || document.querySelector('#folderModal h4'); 
        if (folderTitle) folderTitle.textContent = "Edit Folder"; 
        folderModal.style.display = 'flex';
    }
    
    if (e.target.classList.contains('edit-collab-btn')) {
        editingCollabId = e.target.getAttribute('data-id'); 
        
        const emailInput = document.getElementById('collabEmail'); 
        emailInput.value = e.target.getAttribute('data-email'); 
        emailInput.readOnly = true;
        
        document.getElementById('collabRole').value = e.target.getAttribute('data-role'); 
        document.querySelector('#collabModal h4').textContent = "Edit Role Kolaborator"; 
        
        const submitBtn = document.querySelector('#collabForm button[type="submit"]');
        if(submitBtn) submitBtn.textContent = "Simpan Perubahan";
        
        collabModal.style.display = 'flex';
    }
    if (e.target.classList.contains('delete-collab-btn')) {
        if (confirm("Cabut akses kolaborator ini?")) { 
            await fetch(`http://localhost:3000/api/collabs/${e.target.getAttribute('data-id')}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); 
            fetchCollabs(); 
            logActivity('Cabut Akses', 'Akses kolaborator dicabut'); 
        }
    }
    if (e.target.classList.contains('delete-tag-btn')) {
        if (confirm("Yakin ingin menghapus Tag ini?")) { 
            await fetch(`http://localhost:3000/api/tags/${e.target.getAttribute('data-id')}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); 
            fetchTags(); 
            logActivity('Hapus Tag', 'Sebuah tag dihapus');
        }
    }
    if (e.target.classList.contains('edit-tag-btn')) {
        editingTagId = e.target.getAttribute('data-id'); 
        document.getElementById('tagName').value = e.target.getAttribute('data-name'); 
        document.getElementById('tagColor').value = e.target.getAttribute('data-color'); 
        document.getElementById('tagModalTitle').textContent = "Edit Tag"; 
        tagModal.style.display = 'flex';
    }

    if (e.target.classList.contains('delete-activity-btn')) {
        if (confirm("Hapus riwayat aktivitas ini?")) {
            try {
                await fetch(`http://localhost:3000/api/activities/${e.target.getAttribute('data-id')}`, { 
                    method: 'DELETE', 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                fetchActivities();
                showToast("Aktivitas dihapus", "success");
            } catch (error) {
                showToast("Gagal menghapus aktivitas", "error");
            }
        }
    }

    if (e.target.classList.contains('reset-collab-btn')) {
        const userId = e.target.getAttribute('data-id');
        const username = e.target.getAttribute('data-username');
        if (await showCustomConfirm('Reset Limit', `Reset limit edit kolaborasi untuk user "${username}" menjadi 0?`)) {
            try {
                const response = await fetch(`http://localhost:3000/api/users/${userId}/reset-collab`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    showToast(result.message || "Limit berhasil di-reset!", "success");
                    logActivity('Reset Limit Kolaborasi', `Limit user ${username} di-reset`);
                    fetchAdminData();
                } else {
                    showToast(result.message, "error");
                }
            } catch (error) {
                showToast("Gagal mereset limit user.", "error");
            }
        }
    }

    if (e.target.classList.contains('edit-bulletin-btn')) {
        editingBulletinId = e.target.getAttribute('data-id');
        document.getElementById('bulletinTitle').value = e.target.getAttribute('data-title');
        document.getElementById('bulletinContent').value = e.target.getAttribute('data-content');
        document.getElementById('bulletinModalTitle').textContent = "Edit Buletin";
        bulletinModal.style.display = 'flex';
    }

    if (e.target.classList.contains('delete-bulletin-btn')) {
        if (await showCustomConfirm('Hapus Buletin', 'Yakin ingin menghapus buletin ini?')) {
            try {
                const response = await fetch(`http://localhost:3000/api/bulletins/${e.target.getAttribute('data-id')}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    showToast(result.message || "Buletin berhasil dihapus!", "success");
                    logActivity('Hapus Buletin', 'Sebuah buletin dihapus');
                    fetchAdminData();
                    fetchBulletinWidget();
                } else {
                    showToast(result.message, "error");
                }
            } catch (error) {
                showToast("Gagal menghapus buletin.", "error");
            }
        }
    }
});

function showCustomConfirm(title, text, requireInput = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const inputField = document.getElementById('confirmInput');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmText').textContent = text;
        if(requireInput) { 
            inputField.style.display = 'block'; 
            inputField.value = ''; 
        } else { 
            inputField.style.display = 'none'; 
        }
        modal.style.display = 'flex';
        document.getElementById('btnConfirmOk').onclick = () => {
            if(requireInput) {
                if(inputField.value === 'HAPUS') { 
                    modal.style.display = 'none'; 
                    resolve(true); 
                } else { 
                    showToast('Gagal: Anda harus mengetik HAPUS huruf besar semua!', 'error'); 
                }
            } else { 
                modal.style.display = 'none'; 
                resolve(true); 
            }
        };
        document.getElementById('btnConfirmCancel').onclick = () => { 
            modal.style.display = 'none'; 
            resolve(false); 
        };
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const userDataString = localStorage.getItem("user");
    
    if (!userDataString || !token) {
        window.location.href = "login.html";
        return;
    }

    const userData = JSON.parse(userDataString);
    const userRole = userData.role;
    const topbarName = document.getElementById("topbarName");

    if (userRole === "admin") {
        topbarName.innerText = `Admin ${userData.username}`;
        
        document.querySelectorAll('.role-user').forEach(el => {
            el.style.setProperty('display', 'none', 'important'); 
            el.classList.remove('d-md-block'); 
        });

        document.querySelectorAll('.role-admin').forEach(el => {
            el.style.display = 'block';
        });

        currentView = 'admin_dashboard';
        setActiveNav(navAdminDashboard);
        renderAdminDashboard();

    } 
    else {
        topbarName.innerText = userData.username;
        
        document.querySelectorAll('.role-admin').forEach(el => {
            el.style.setProperty('display', 'none', 'important');
        });

        document.querySelectorAll('.role-user').forEach(el => {
            el.style.display = ''; 
        });

        currentView = 'notes';
        if (navNotes) setActiveNav(navNotes);
        
        await fetchFolders(); 
        await fetchNotes();   
        await fetchCollabs();
        await fetchTags();
        await fetchBulletinWidget();
    }
});

const userAvatar = document.getElementById('userAvatar');
const settingsModal = document.getElementById('settingsModal');
const settingsForm = document.getElementById('settingsForm');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

if (userAvatar && settingsModal) {
    userAvatar.addEventListener('click', () => {
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editPassword').value = ''; 
        settingsModal.style.display = 'flex';
    });
}
if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');

if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUsername = document.getElementById('editUsername').value;
        const newEmail = document.getElementById('editEmail').value;
        
        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id: user.id, username: newUsername, email: newEmail, password: document.getElementById('editPassword').value })
            });
            const result = await response.json();
            
            const avatarFile = document.getElementById('editAvatar').files[0];
            let avatarUrlBaru = user.avatarUrl; 
            
            if (avatarFile && result.success) {
                const avatarData = new FormData();
                avatarData.append('avatar', avatarFile);
                const avatarRes = await fetch('/api/users/profile/avatar', {
                    method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: avatarData
                });
                const avatarResult = await avatarRes.json();
                if(avatarResult.success) avatarUrlBaru = avatarResult.data.avatarUrl;
            }

            if (result.success) {
                showToast("Profil berhasil diperbarui!", "success");
                
                // Menggunakan data 'result.user' dari server untuk memastikan ID tetap terjaga aman
                const updatedUser = { 
                    id: result.user.id, 
                    username: result.user.username, 
                    email: result.user.email, 
                    role: result.user.role, 
                    avatarUrl: avatarUrlBaru 
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                renderUserAvatarBaru(updatedUser);
                setTimeout(() => { settingsModal.style.display = 'none'; }, 1000);
            } else { showToast(result.message, "error"); }
        } catch (error) { showToast("Terjadi kesalahan server saat update.", "error"); }
    });
}

const logoutBtn = document.getElementById('logoutSettingsBtn');
if(logoutBtn) logoutBtn.addEventListener('click', async () => {
    settingsModal.style.display = 'none'; 
    if (await showCustomConfirm('Logout', 'Yakin ingin keluar dari sesi Memoora saat ini?')) {
        localStorage.clear(); 
        window.location.href = '/login';
    } else { 
        settingsModal.style.display = 'flex'; 
    }
});

const delAccBtn = document.getElementById('deleteAccountSettingsBtn');
if(delAccBtn) delAccBtn.addEventListener('click', async () => {
    settingsModal.style.display = 'none'; 
    if (await showCustomConfirm('Hapus Akun', 'Menghapus akun akan memusnahkan seluruh catatan dan folder Anda secara permanen. Lanjutkan?')) {
        if (await showCustomConfirm('Konfirmasi Akhir', 'Ketik kata HAPUS di bawah ini untuk memusnahkan akun:', true)) {
            try {
                const response = await fetch(`http://localhost:3000/api/users/${user.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                const result = await response.json();
                if (result.success) { 
                    showToast("Akun berhasil dimusnahkan. Selamat tinggal!", "success"); 
                    setTimeout(() => { localStorage.clear(); window.location.href = '/login'; }, 1500); 
                }
            } catch (error) { 
                showToast("Gagal menghapus akun karena masalah server.", "error"); 
            }
        } else { 
            settingsModal.style.display = 'flex'; 
        }
    } else { 
        settingsModal.style.display = 'flex'; 
    }
});

document.getElementById('menu-toggle').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('wrapper').classList.toggle('toggled');
});

const globalAddBtn = document.getElementById('addNoteBtn');
if (globalAddBtn) {
    globalAddBtn.addEventListener('click', () => {
        if (currentView === 'notes') {
            editingNoteId = null;
            noteForm.reset();
            document.querySelector('#noteModal h4').textContent = "Buat Catatan Baru";
            noteModal.style.display = 'flex';
        } else if (currentView === 'folders') {
            editingFolderId = null;
            folderForm.reset();
            const folderTitle = document.getElementById('folderModalTitle') || document.querySelector('#folderModal h4');
            if (folderTitle) folderTitle.textContent = "Buat Folder Baru";
            folderModal.style.display = 'flex';
        } else if (currentView === 'collabs') {
            editingCollabId = null;
            collabForm.reset();
            document.getElementById('collabEmail').readOnly = false;
            document.querySelector('#collabModal h4').textContent = "Undang Kolaborator";
            const submitBtn = document.querySelector('#collabForm button[type="submit"]');
            if(submitBtn) submitBtn.textContent = "Kirim Undangan";
            collabModal.style.display = 'flex';
        } else if (currentView === 'tags') {
            editingTagId = null;
            tagForm.reset();
            document.getElementById('tagModalTitle').textContent = "Buat Tag Baru";
            tagModal.style.display = 'flex';
        } else if (currentView === 'bulletin_management') {
            editingBulletinId = null;
            bulletinForm.reset();
            document.getElementById('bulletinModalTitle').textContent = "Buat Buletin Baru";
            bulletinModal.style.display = 'flex';
        }
    });
}

const socket = io(); 

socket.on('refresh_bulletin', () => {
    if (user && user.role === 'admin' && currentView === 'bulletin_management') {
        fetchAdminData(); 
    } 
    else if (user && user.role !== 'admin') {
        fetchBulletinWidget();
    }
});

const requestResetBtn = document.getElementById('requestResetBtn');
if (requestResetBtn) {
    requestResetBtn.addEventListener('click', async () => {
        try {
            const requestBtnOrigText = requestResetBtn.textContent;
            requestResetBtn.textContent = "Mengirim...";
            
            const response = await fetch('/api/users/request-reset', { 
                method: 'PUT', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const result = await response.json();
            
            if (result.success) {
                showToast(result.message, 'success');
                document.getElementById('settingsModal').style.display = 'none';
            } else {
                showToast(result.message, 'error');
            }
            requestResetBtn.textContent = requestBtnOrigText;
        } catch (error) {
            showToast("Terjadi kesalahan server.", "error");
        }
    });
}

const mainWrapper = document.getElementById('wrapper');
const contentArea = document.getElementById('page-content-wrapper');

document.querySelectorAll('#sidebarNav .list-group-item').forEach(menuItem => {
    menuItem.addEventListener('click', () => {
        if (window.innerWidth < 768) {
            mainWrapper.classList.remove('toggled');
        }
    });
});

contentArea.addEventListener('click', (e) => {
    if (window.innerWidth < 768 && mainWrapper.classList.contains('toggled')) {
        if (!e.target.closest('#menu-toggle')) {
            mainWrapper.classList.remove('toggled');
        }
    }
});