// 1. Cấu hình Firebase (Bảo Anh giữ nguyên thông tin này)
const firebaseConfig = {
    apiKey: "AIzaSyDVZ1Zfg0XSSS2mVE4WXFI3x1IzFty0XvY",
    authDomain: "clothingmanager-1120.firebaseapp.com",
    projectId: "clothingmanager-1120",
    storageBucket: "clothingmanager-1120.firebasestorage.app",
    messagingSenderId: "836369966463",
    appId: "1:836369966463:web:4301ab9e49687d2eed664a",
    measurementId: "G-FMRD8Z7XBL",
    databaseURL: "https://clothingmanager-1120-default-rtdb.asia-southeast1.firebasedatabase.app/" // Đảm bảo link này khớp với Database của bạn
};

// 2. Khởi tạo Firebase (Dùng bản Compat để đồng bộ với HTML)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 3. Các phần tử giao diện
const btnAdd = document.getElementById('btn-add');
const list = document.getElementById('product-list');
const totalPriceEl = document.getElementById('total-price');

// 4. Lắng nghe dữ liệu thay đổi trên server
db.ref('clothes').on('value', (snapshot) => {
    const data = snapshot.val();
    renderItems(data);
});
// Gán sự kiện để khi bấm nút thì hàm addItem mới chạy
btnAdd.onclick = addItem;
// 5. Hàm thêm món đồ mới
function addItem() {
    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;
    const imageFile = document.getElementById('item-image').files[0];

    if (!name || !price || !imageFile) return alert("Thiếu thông tin!");

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            // Tạo canvas để nén ảnh
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Xuất ra chuỗi base64 đã nén (chất lượng 0.7)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            const newItem = {
                name,
                price: parseFloat(price),
                image: compressedBase64, // Dùng ảnh đã nén
                isBought: false,
                comments: []
            };
            db.ref('clothes').push(newItem);
            
            // Reset form
            document.getElementById('item-name').value = '';
            document.getElementById('item-price').value = '';
            document.getElementById('item-image').value = '';
        };
    };
    reader.readAsDataURL(imageFile);
}

// 6. Hàm hiển thị danh sách (Dùng giao diện mới tối ưu mobile)
function renderItems(itemsObj) {
    const list = document.getElementById('product-list');
    if (!list) return; // Bảo vệ code nếu trang không có list

    list.innerHTML = '';
    list.className = 'product-grid'; // Kích hoạt lưới 2 cột từ CSS
    
    let total = 0;
    
    if (!itemsObj) {
        if (totalPriceEl) totalPriceEl.innerText = '0 ₫';
        return;
    }

    Object.keys(itemsObj).forEach(key => {
        const item = itemsObj[key];
        total += item.price;
        
        const card = document.createElement('div');
        card.className = `card ${item.isBought ? 'bought' : ''}`;
        
        // Cấu trúc HTML tối ưu: Ảnh ở trên, nội dung ở dưới
        card.innerHTML = `
            <button onclick="deleteItem('${key}')" class="btn-delete">×</button>
            <div class="card-img-container">
                <img src="${item.image}" loading="lazy">
            </div>
            <div class="card-body">
                <h3>${item.name}</h3>
                <p class="price">${item.price.toLocaleString()} ₫</p>
                
                <label class="status-row">
                    <input type="checkbox" ${item.isBought ? 'checked' : ''} 
                           onchange="toggleBought('${key}', ${item.isBought})">
                    <span>${item.isBought ? 'Đã mua' : 'Đang chọn'}</span>
                </label>
            </div>
        `;
        list.appendChild(card);
    });

    if (totalPriceEl) {
        totalPriceEl.innerText = total.toLocaleString() + ' ₫';
    }
}

// 7. Các hàm tương tác với Firebase (Gắn vào window để gọi được từ HTML)
window.deleteItem = (key) => {
    if(confirm("Bạn có chắc muốn xóa món đồ này?")) {
        db.ref('clothes/' + key).remove();
    }
};

window.toggleBought = (key, current) => {
    db.ref('clothes/' + key).update({ isBought: !current });
};

window.addComment = (key) => {
    const val = document.getElementById('in-' + key).value;
    if (!val) return;
    
    db.ref('clothes/' + key + '/comments').once('value', s => {
        const currentComms = s.val() || [];
        currentComms.push(val);
        db.ref('clothes/' + key).update({ comments: currentComms });
        document.getElementById('in-' + key).value = '';
    });
};




window.onload = () => {
    // Nếu có nút btn-add thì mới gán sự kiện (trang index)
    if (btnAdd) {
        btnAdd.onclick = addItem;
    }

    // Luôn lắng nghe database để cập nhật giao diện (cả 2 trang)
    db.ref('clothes').on('value', (snapshot) => {
        const data = snapshot.val();
        if (list) { // Nếu trang có phần tử hiển thị danh sách
            renderItems(data);
        }
    });
};  