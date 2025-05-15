
const animateCards = (items, delay = 100) => {
    items.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, delay * i);
    });
};


const handleSearch = (term) => {
    document.querySelectorAll('.career-item').forEach(item => {
        const show = term === '' ||
            item.dataset.title.includes(term);
        item.style.opacity = show ? '1' : '0';
        item.style.transform = show ? 'translateY(0)' : 'translateY(20px)';
        item.style.display = show ? 'block' : 'none';
    });
};

document.addEventListener('DOMContentLoaded', () => {
    animateCards(document.querySelectorAll('.career-item'));

    const searchInput = document.getElementById('searchInput');
    searchInput?.addEventListener('input', (e) => {
        handleSearch(e.target.value.toLowerCase().trim());
    });
});