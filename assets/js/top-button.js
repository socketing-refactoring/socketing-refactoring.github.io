window.onscroll = function () {
const btn = document.getElementById("topBtn");
if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
    btn.style.display = "block";
} else {
    btn.style.display = "none";
}
};

document.getElementById("topBtn").onclick = function () {
window.scrollTo({ top: 0, behavior: 'smooth' });
};
