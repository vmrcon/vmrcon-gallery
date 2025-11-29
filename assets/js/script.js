/**
 * Gallery Script
 *
 * This file manages the interactive image gallery, including:
 * - Card stack rendering and swipe/drag navigation
 * - Lightbox modal for viewing images
 * - Favorites management with localStorage persistence
 * - Progress bar updates
 * - History modal for favorite images
 * - Mouse follower effect and keyboard navigation
 *
 * Refactoring notes:
 * - Keep DOM queries at the top for clarity
 * - Group related logic into clear sections (render, state, events)
 * - Minimize global variables; prefer function scope where possible
 * - Avoid code repetition (e.g., favorite toggling)
 * - Ensure all UI updates are in sync with state
 * - Maintain accessibility and performance
 */

const profileLink = "https://x.com/vmrcon";

// --- State ---
const images = [
  { id: 1, url: "./assets/img/8082.jpg", title: "Realistic Tiger Rider", isFav: false },
  { id: 2, url: "./assets/img/8095.jpg", title: "Edo Kingdom From Mountaintop View", isFav: false },
];

let currentIndex = 0;
let maxIndexReached = 0;
let lightboxIndex = 0;

// --- DOM Elements ---
const cardStack = document.getElementById("cardStack");
const progressFill = document.getElementById("progressFill");
const glow = document.getElementById("cursor-glow");
const lightbox = document.getElementById("lightbox");
const lightboxContent = document.getElementById("lightboxContent");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxHeart = document.getElementById("lightboxHeart");
const historyModal = document.getElementById("historyModal");
const historyContent = document.getElementById("historyContent");
const favoritesList = document.getElementById("favoritesList");
const emptyHistory = document.getElementById("emptyHistory");

// --- Initialization ---
const init = () => {
  loadFavorites();
  renderCards();
  updateProgress();
  document.addEventListener("mousemove", mouseFollower);
};

const mouseFollower = e => {
  glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
};

// --- Local Storage ---
const loadFavorites = () => {
  const saved = JSON.parse(localStorage.getItem("vmrcon_gallery_favorites")) || [];
  images.forEach(img => img.isFav = saved.includes(img.id));
};

const saveFavorites = () => {
  localStorage.setItem(
    "vmrcon_gallery_favorites",
    JSON.stringify(images.filter(img => img.isFav).map(img => img.id))
  );
};

// --- Card Rendering ---
const renderCards = () => {
  cardStack.innerHTML = "";
  const renderLimit = 3;
  for (let i = 0; i < renderLimit; i++) {
    const imgIndex = (currentIndex + i) % images.length;
    const image = images[imgIndex];
    const card = document.createElement("div");
    card.className = "gallery-card";
    card.style.zIndex = renderLimit - i;
    if (i === 0) {
      card.style.transform = "scale(1) translateX(0)";
      card.style.opacity = "1";
      setupDrag(card);
    } else {
      card.style.transform = `translateX(${i * 40}px) scale(${1 - i * 0.05})`;
      card.style.opacity = i === 1 ? "1" : "0.5";
      card.style.filter = "brightness(0.9)";
      card.style.pointerEvents = "none";
    }
    card.innerHTML = `
      <div class="relative w-full h-full group">
        <img src="${image.url}" alt="${image.title}" draggable="false">
        <div class="absolute top-4 right-4 flex gap-2 opacity-100 transition-opacity">
          <button class="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform" onclick="event.stopPropagation(); downloadImage(${image.id})">
            <i class="fa-solid fa-download text-slate-700"></i>
          </button>
          <button class="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform" onclick="event.stopPropagation(); toggleFavInStack(${image.id})">
            <i class="${image.isFav ? "fa-solid text-red-500" : "fa-regular text-slate-700"} fa-heart"></i>
          </button>
        </div>
      </div>
    `;
    cardStack.appendChild(card);
  }
};

// --- Drag/Swipe ---
const setupDrag = card => {
  let startX = 0, startY = 0, currentX = 0, currentY = 0, isDragging = false;

  const onDown = e => {
    isDragging = true;
    startX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    startY = e.type.includes("mouse") ? e.clientY : e.touches[0].clientY;
    card.classList.add("dragging");
  };

  const onMove = e => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes("mouse") ? e.clientY : e.touches[0].clientY;

    currentX = clientX - startX;
    currentY = clientY - startY;
    card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${currentX * 0.05}deg)`;
  };

  const onUp = () => {
    if (!isDragging) return;
    isDragging = false;
    card.classList.remove("dragging");
    const threshold = 100;
    
    if (Math.abs(currentX) < 5 && Math.abs(currentY) < 5) {
      openLightbox(currentIndex);
      card.style.transform = "scale(1) translateX(0)";
      return;
    }
    if (Math.abs(currentX) > threshold) {
      const direction = currentX > 0 ? 1 : -1;
      card.style.transition = "transform 0.5s ease-out";
      card.style.transform = `translate(${window.innerWidth * direction}px, ${currentY + 100}px) rotate(${direction * 30}deg)`;
      
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % images.length;
        maxIndexReached = Math.max(maxIndexReached, currentIndex);
        updateProgress();
        renderCards();
      }, 300);
    } else {
      card.style.transform = "scale(1) translateX(0)";
    }
  };

  card.addEventListener("mousedown", onDown);
  card.addEventListener("touchstart", onDown);

  window.addEventListener("mousemove", onMove);
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchend", onUp);
};

// --- Progress Bar ---
const updateProgress = () => {
  let percent = ((currentIndex + 1) / images.length) * 100;
  if (percent > 100) percent = 100;
  progressFill.style.width = `${percent}%`;

  if (percent === 100) {
    progressFill.classList.add("bg-green-500");
    progressFill.classList.remove("bg-blue-600");
  } else {
    progressFill.classList.add("bg-blue-600");
    progressFill.classList.remove("bg-green-500");
  }
};

// --- Lightbox ---
const openLightbox = index => {
  lightboxIndex = index;
  updateLightboxContent();
  lightbox.classList.remove("hidden");
  void lightbox.offsetWidth;
  lightbox.classList.remove("opacity-0");
  lightboxContent.classList.remove("scale-90");
  lightboxContent.classList.add("scale-100");
};

const closeLightbox = () => {
  lightbox.classList.add("opacity-0");
  lightboxContent.classList.remove("scale-100");
  lightboxContent.classList.add("scale-90");
  setTimeout(() => lightbox.classList.add("hidden"), 300);
};

const updateLightboxContent = () => {
  const img = images[lightboxIndex];
  lightboxImg.src = img.url;

  if (img.isFav) {
    lightboxHeart.classList.remove("fa-regular");
    lightboxHeart.classList.add("fa-solid", "text-red-500");
  } else {
    lightboxHeart.classList.add("fa-regular");
    lightboxHeart.classList.remove("fa-solid", "text-red-500");
  }
};

const nextImage = () => {
  lightboxIndex = (lightboxIndex + 1) % images.length;
  lightboxImg.style.opacity = 0;

  setTimeout(() => {
    updateLightboxContent();
    lightboxImg.style.opacity = 1;
  }, 200);
};

const prevImage = () => {
  lightboxIndex = (lightboxIndex - 1 + images.length) % images.length;
  lightboxImg.style.opacity = 0;

  setTimeout(() => {
    updateLightboxContent();
    lightboxImg.style.opacity = 1;
  }, 200);
};

// --- History Modal ---
const openHistory = () => {
  renderFavorites();
  historyModal.classList.remove("hidden");
  void historyModal.offsetWidth;

  historyModal.classList.remove("opacity-0");
  historyContent.classList.remove("scale-95");
  historyContent.classList.add("scale-100");
};

const closeHistory = () => {
  historyModal.classList.add("opacity-0");
  historyContent.classList.remove("scale-100");
  historyContent.classList.add("scale-95");
  setTimeout(() => historyModal.classList.add("hidden"), 300);
};

const renderFavorites = () => {
  const favImages = images.filter(img => img.isFav);
  favoritesList.innerHTML = "";
  if (favImages.length === 0) {
    emptyHistory.classList.remove("hidden");
    return;
  }
  emptyHistory.classList.add("hidden");
  favImages.forEach(img => {
    const item = document.createElement("div");
    item.className = "group relative w-full h-48 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow";
    item.innerHTML = `
      <img src="${img.url}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" alt="${img.title}">
      <div class="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
      <div class="absolute top-3 right-3 flex flex-col gap-2">
        <button onclick="toggleFavInStack(${img.id}); renderFavorites()" class="w-10 h-10 bg-white/90 hover:bg-red-50 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110">
          <i class="fa-solid fa-heart text-red-500"></i>
        </button>
        <button onclick="downloadImage(${img.id})" class="w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110">
          <i class="fa-solid fa-download text-slate-700"></i>
        </button>
      </div>
      <div class="absolute bottom-4 left-4">
        <span class="text-white font-semibold text-shadow shadow-black/50">${img.title}</span>
      </div>
    `;
    favoritesList.appendChild(item);
  });
};

// --- Actions ---
const downloadImage = id => {
  const img = images.find(i => i.id === id);
  if (!img) return;
  const link = document.createElement('a');
  link.href = img.url;
  link.download = img.title.replace(/\s+/g, '_') + img.url.substring(img.url.lastIndexOf('.'));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Downloading ${img.title}...`);
};

const downloadCurrent = () => {
  downloadImage(images[lightboxIndex].id);
};

const downloadAll = () => {
  showToast("Downloading all images...");
  images.forEach(img => {
    fetch(img.url)
      .then(res => res.blob())
      .then(blob => {
        const ext = img.url.substring(img.url.lastIndexOf('.'));
        const link = document.createElement('a');

        link.href = URL.createObjectURL(blob);
        link.download = img.title.replace(/\s+/g, '_') + ext;
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      });
  });
};

const toggleFavInStack = id => {
  const img = images.find(i => i.id === id);
  if (img) {
    img.isFav = !img.isFav;
    saveFavorites();
    renderCards();
    showToast(img.isFav ? "Added to favorites" : "Removed from favorites");
  }
};

const toggleFavorite = () => {
  const img = images[lightboxIndex];
  img.isFav = !img.isFav;
  saveFavorites();
  updateLightboxContent();
  renderCards();
  showToast(img.isFav ? "Added to favorites" : "Removed from favorites");
};

const showToast = msg => {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  toastMsg.innerText = msg;
  toast.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => toast.classList.add("translate-y-20", "opacity-0"), 2500);
};

// --- Keyboard Navigation ---
document.addEventListener("keydown", e => {
  if (!lightbox.classList.contains("hidden")) {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  }

  if (!historyModal.classList.contains("hidden")) {
    if (e.key === "Escape") closeHistory();
  }
});

// --- Profile Picture Click Handler ---
const profilePic = document.querySelector('.profile-container');
if (profilePic) {
  profilePic.addEventListener('click', () => {
    if (profileLink) window.open(profileLink, '_blank');
  });
}

init();