// 1. Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDVZ1Zfg0XSSS2mVE4WXFI3x1IzFty0XvY",
    authDomain: "clothingmanager-1120.firebaseapp.com",
    projectId: "clothingmanager-1120",
    storageBucket: "clothingmanager-1120.firebasestorage.app",
    messagingSenderId: "836369966463",
    appId: "1:836369966463:web:4301ab9e49687d2eed664a",
    measurementId: "G-FMRD8Z7XBL",
    databaseURL: "https://clothingmanager-1120-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 2. Các phần tử giao diện
const btnAdd = document.getElementById('btn-add');
const list = document.getElementById('product-list');
const totalPriceEl = document.getElementById('total-price');

// 3. Toast thông báo
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg || '✅ Đã lưu thành công!';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

// 4. Preview ảnh trước khi lưu
function setupImagePreview() {
    const fileInput = document.getElementById('item-image');
    if (!fileInput) return;

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;

        const previewWrap = document.getElementById('img-preview-wrap');
        const previewImg = document.getElementById('img-preview');
        const fileText = document.getElementById('file-text');

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewWrap.style.display = 'block';
            if (fileText) fileText.textContent = '✅ ' + file.name;
        };
        reader.readAsDataURL(file);
    });
}

window.clearImage = () => {
    document.getElementById('item-image').value = '';
    document.getElementById('img-preview-wrap').style.display = 'none';
    const fileText = document.getElementById('file-text');
    if (fileText) fileText.textContent = '📸 Nhấn để chọn ảnh';
};

// 5. Hàm thêm món đồ mới
function addItem() {
    const name = document.getElementById('item-name').value.trim();
    const price = document.getElementById('item-price').value;
    const imageFile = document.getElementById('item-image').files[0];

    if (!name || !price || !imageFile) {
        showToast('⚠️ Vui lòng điền đầy đủ thông tin!');
        return;
    }

    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline';
    if (btnAdd) btnAdd.disabled = true;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            const newItem = { name, price: parseFloat(price), image: compressedBase64, isBought: false, comments: [] };

            db.ref('clothes').push(newItem)
                .then(() => {
                    showToast('✅ Đã lưu thành công!');
                    document.getElementById('item-name').value = '';
                    document.getElementById('item-price').value = '';
                    clearImage();
                })
                .catch(() => showToast('❌ Lưu thất bại, thử lại nhé!'))
                .finally(() => {
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoader) btnLoader.style.display = 'none';
                    if (btnAdd) btnAdd.disabled = false;
                });
        };
    };
    reader.readAsDataURL(imageFile);
}

// 6. Hàm hiển thị danh sách
function renderItems(itemsObj) {
    if (!list) return;
    list.innerHTML = '';
    list.className = 'product-grid';

    if (!itemsObj) {
        if (totalPriceEl) totalPriceEl.innerText = '0 ₫';
        return;
    }

    let total = 0;

    Object.keys(itemsObj).forEach(key => {
        const item = itemsObj[key];
        if (item.isBought) total += item.price;

        const comments = item.comments || [];
        const commentsHTML = comments.length > 0
            ? comments.map((c, i) => `
                <li class="comment-item" id="citem-${key}-${i}">
                    <span class="comment-text">💬 ${c}</span>
                    <div class="comment-actions">
                        <button class="btn-comment-action btn-edit-c" onclick="editComment('${key}', ${i})" title="Sửa">✏️</button>
                        <button class="btn-comment-action btn-del-c" onclick="deleteComment('${key}', ${i})" title="Xóa">🗑</button>
                    </div>
                </li>`).join('')
            : '<li class="empty">Chưa có ghi chú...</li>';

        const card = document.createElement('div');
        card.className = `card ${item.isBought ? 'bought' : ''}`;
        card.innerHTML = `
            <button onclick="deleteItem('${key}')" class="btn-delete">×</button>
            <div class="card-img-container">
                <img src="${item.image}" loading="lazy" alt="${item.name}">
            </div>
            <div class="card-body">
                <h3>${item.name}</h3>
                <p class="price">${item.price.toLocaleString()} ₫</p>
                <label class="status-row">
                    <input type="checkbox" ${item.isBought ? 'checked' : ''}
                           onchange="toggleBought('${key}', ${item.isBought})">
                    <span>${item.isBought ? 'Mua ✓' : 'Xem xét mua'}</span>
                </label>
            </div>
            <div class="comment-section">
                <ul class="comment-list" id="comments-${key}">${commentsHTML}</ul>
                <div class="comment-input-row">
                    <input type="text" id="in-${key}" placeholder="Ghi chú..." />
                    <button onclick="addComment('${key}')">+</button>
                </div>
            </div>
        `;
        list.appendChild(card);

        document.getElementById('in-' + key).addEventListener('keydown', e => {
            if (e.key === 'Enter') addComment(key);
        });
    });

    if (totalPriceEl) totalPriceEl.innerText = total.toLocaleString() + ' ₫';
    updateStats(itemsObj);
}

// 7. Các hàm Firebase
window.deleteItem = (key) => {
    if (confirm("Bạn có chắc muốn xóa món đồ này?")) {
        db.ref('clothes/' + key).remove();
    }
};

window.toggleBought = (key, current) => {
    db.ref('clothes/' + key).update({ isBought: !current });
};

window.addComment = (key) => {
    const input = document.getElementById('in-' + key);
    const val = input.value.trim();
    if (!val) return;
    db.ref('clothes/' + key + '/comments').once('value', s => {
        const currentComms = s.val() || [];
        currentComms.push(val);
        db.ref('clothes/' + key).update({ comments: currentComms });
        input.value = '';
    });
};

window.deleteComment = (key, index) => {
    db.ref('clothes/' + key + '/comments').once('value', s => {
        const comms = s.val() || [];
        comms.splice(index, 1);
        db.ref('clothes/' + key).update({ comments: comms });
    });
};

window.editComment = (key, index) => {
    const li = document.getElementById(`citem-${key}-${index}`);
    if (!li) return;

    const textSpan = li.querySelector('.comment-text');
    const actions = li.querySelector('.comment-actions');
    const oldText = textSpan.textContent.replace('💬 ', '').trim();

    // Thay bằng input inline
    textSpan.style.display = 'none';
    actions.style.display = 'none';

    const editWrap = document.createElement('div');
    editWrap.className = 'comment-edit-wrap';
    editWrap.innerHTML = `
        <input class="comment-edit-input" type="text" value="${oldText}" />
        <button class="btn-comment-save" onclick="saveComment('${key}', ${index}, this)">✅</button>
        <button class="btn-comment-cancel" onclick="cancelEdit('${key}', ${index}, this, '${oldText}')">✕</button>
    `;
    li.appendChild(editWrap);

    const inp = editWrap.querySelector('input');
    inp.focus();
    inp.select();
    inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveComment(key, index, editWrap.querySelector('.btn-comment-save'));
        if (e.key === 'Escape') cancelEdit(key, index, editWrap.querySelector('.btn-comment-cancel'), oldText);
    });
};

window.saveComment = (key, index, btn) => {
    const li = btn.closest('li');
    const newVal = li.querySelector('.comment-edit-input').value.trim();
    if (!newVal) return;

    db.ref('clothes/' + key + '/comments').once('value', s => {
        const comms = s.val() || [];
        comms[index] = newVal;
        db.ref('clothes/' + key).update({ comments: comms });
        // Firebase listener sẽ tự re-render
    });
};

window.cancelEdit = (key, index, btn, oldText) => {
    const li = btn.closest('li');
    li.querySelector('.comment-text').style.display = '';
    li.querySelector('.comment-actions').style.display = '';
    const wrap = li.querySelector('.comment-edit-wrap');
    if (wrap) wrap.remove();

};

// 8. Thông báo hệ thống
function sendNotification(title, message) {
    if (Notification.permission === "granted") {
        new Notification(title, { body: message, icon: 'https://cdn-icons-png.flaticon.com/512/3502/3502214.png' });
    }
}

// 9. Khởi động app
window.onload = () => {
    if ("Notification" in window) Notification.requestPermission();

    if (btnAdd) btnAdd.onclick = addItem;

    setupImagePreview();

    if (list) {
        db.ref('clothes').on('value', (snapshot) => renderItems(snapshot.val()));
    }

    let initialDataLoaded = false;
    db.ref('clothes').once('value', () => { initialDataLoaded = true; });
    db.ref('clothes').on('child_added', (snapshot) => {
        if (initialDataLoaded) {
            const newItem = snapshot.val();
            sendNotification("Có đồ mới! ✨", `"${newItem.name}" vừa được thêm vào tủ.`);
        }
    });
};



//thong ke
function updateStats(itemsObj) {

    if (!itemsObj) {
        document.getElementById('total-count').textContent = 0;
        document.getElementById('selected-count').textContent = 0;
        return;
    }

    const items = Object.values(itemsObj);

    const totalCount = items.length;

    const selectedCount = items.filter(
        item => item.isBought
    ).length;

    document.getElementById('total-count').textContent = totalCount;

    document.getElementById('selected-count').textContent = selectedCount;
}

// =============================================
// BANK MODAL
// =============================================

window.openBankModal = (src) => {

    const modal = document.getElementById('bankModal');
    const img = document.getElementById('bankModalImg');

    img.src = src;

    modal.classList.add('show');

    document.body.style.overflow = 'hidden';
};

window.closeBankModal = () => {

    document.getElementById('bankModal')
        .classList.remove('show');

    document.body.style.overflow = '';
};

// click nền để thoát
document.addEventListener('click', (e) => {

    const modal = document.getElementById('bankModal');

    if (
        e.target === modal
    ) {
        closeBankModal();
    }
});