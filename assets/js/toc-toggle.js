document.addEventListener("DOMContentLoaded", function () {
    const tocContainer = document.getElementById("tocContainer");
    const toggleBtn = document.getElementById("tocToggleBtn");
  
    toggleBtn.addEventListener("click", function () {
      tocContainer.classList.toggle("expanded");
      toggleBtn.textContent = tocContainer.classList.contains("expanded")
        ? "접기"
        : "더 보기";
    });
  });
  