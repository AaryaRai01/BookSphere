document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const GOOGLE_BOOKS_API_KEY = 'AIzaSyBqAGHMY4taTDBOykoESG_42sS6Y1WXz1M';
    const STRIPE_PUBLISHABLE_KEY = 'pk_test_51S1V2aH3DPZm6A7azSZFlnYcCewvoVvBYaFqIzyfAd0JNhm1rkuX6wox7lqrIYnOrN1Ng6lqr1R29L2tI4UpytCI00hEiTX4ce';
    const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    // FIX: Replaced placeholder IDs with the real Stripe Price ID
    const MOCK_STRIPE_PRICE_IDS = [
        'price_1S1WMkH3DPZm6A7a4s7ofK3B',
        'price_1S1WMkH3DPZm6A7a4s7ofK3B',
        'price_1S1WMkH3DPZm6A7a4s7ofK3B',
        'price_1S1WMkH3DPZm6A7a4s7ofK3B',
        'price_1S1WMkH3DPZm6A7a4s7ofK3B',
        'price_1S1WMkH3DPZm6A7a4s7ofK3B',
    ];

    // --- STATE MANAGEMENT ---
    let state = {
        books: [], // A cache of all books fetched
        currentSearchResults: [], // Books currently displayed on the browse page
        isLoggedIn: false,
        currentUser: null, // { email: '...', library: [], wishlist: [] }
    };

    // --- MOCK USER DATABASE (using localStorage) ---
    function getUsers() {
        return JSON.parse(localStorage.getItem('indieReadsUsers')) || [];
    }

    function saveUsers(users) {
        localStorage.setItem('indieReadsUsers', JSON.stringify(users));
    }

    function getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('indieReadsCurrentUser'));
    }

    function setCurrentUser(user) {
        sessionStorage.setItem('indieReadsCurrentUser', JSON.stringify(user));
        state.isLoggedIn = !!user;
        state.currentUser = user;
    }

    // --- DOM ELEMENTS ---
    const pages = {
        home: document.getElementById('home-page'),
        browse: document.getElementById('browse-page'),
        book: document.getElementById('book-detail-page'),
        library: document.getElementById('library-page'),
        wishlist: document.getElementById('wishlist-page'),
        login: document.getElementById('login-page'),
        signup: document.getElementById('signup-page'),
    };

    // --- ROUTING ---
    function showPage(pageId, params = null) {
        document.getElementById('mobile-menu').classList.add('hidden');
        
        Object.values(pages).forEach(p => p.classList.remove('active', 'fade-in'));
        const targetPage = pages[pageId];

        if (targetPage) {
            targetPage.classList.add('active', 'fade-in');
            
            // FIX: Render content specific to the page being shown to ensure it's always up-to-date
            switch(pageId) {
                case 'book':
                    if (params?.id) renderBookDetail(params.id);
                    break;
                case 'library':
                    renderLibrary();
                    break;
                case 'wishlist':
                    renderWishlist();
                    break;
                case 'browse':
                    renderBookGrid();
                    break;
            }
        } else {
            pages.home.classList.add('active', 'fade-in'); // Fallback to home
        }
    }

    function handleHashChange() {
        const hash = window.location.hash.substring(1) || 'home';
        const [pageId, param] = hash.split('/');
        showPage(pageId, param ? { id: param } : null);
    }

    // --- API FETCHING ---
    async function fetchBooks(query = "latest bestselling fiction") {
        const bookGrid = document.getElementById('book-grid');
        if (!bookGrid) return;
        bookGrid.innerHTML = `<p class="text-center text-gray-400 col-span-full">Searching for great reads...</p>`;
        
        const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=12&orderBy=relevance&key=${GOOGLE_BOOKS_API_KEY}`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.error?.message || `Network response failed: ${response.status}`;
                throw new Error(errorMessage);
            }
            const data = await response.json();

            if (!data.items) {
                bookGrid.innerHTML = `<p class="text-center text-yellow-400 col-span-full">No books found for "${query}".</p>`;
                state.currentSearchResults = [];
                renderBookGrid(); 
                return;
            }

            const newBooks = data.items.map((item, index) => ({
                id: item.id,
                title: item.volumeInfo.title || 'No Title',
                author: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
                description: item.volumeInfo.description || 'No description available.',
                cover_image_url: item.volumeInfo.imageLinks?.thumbnail.replace("http://", "https://") || `https://placehold.co/300x450/1F2937/FFFFFF?text=No+Cover`,
                price_in_cents: 999 + Math.floor(Math.random() * 1500),
                stripe_price_id: MOCK_STRIPE_PRICE_IDS[index % MOCK_STRIPE_PRICE_IDS.length],
            }));

            state.currentSearchResults = newBooks;

            newBooks.forEach(book => {
                if (!state.books.find(b => b.id === book.id)) {
                    state.books.push(book);
                }
            });
            
            renderBookGrid();
        } catch (error) {
            console.error("Fetch error:", error);
            bookGrid.innerHTML = `<p class="text-center text-red-400 col-span-full">Could not load books. (${error.message})</p>`;
        }
    }
    
    // --- UI RENDERING ---
    function updateUI() {
        const authContainer = document.getElementById('auth-container');
        const mobileAuthContainer = document.getElementById('mobile-auth-container');
        const navLibrary = document.getElementById('nav-library');
        const navWishlist = document.getElementById('nav-wishlist');
        const mobileNavLibrary = document.getElementById('mobile-nav-library');
        const mobileNavWishlist = document.getElementById('mobile-nav-wishlist');
        
        if (state.isLoggedIn && state.currentUser) {
            authContainer.innerHTML = `<div class="flex items-center gap-4"><span class="text-sm">${state.currentUser.email}</span><button id="logout-button" class="btn btn-danger">Logout</button></div>`;
            document.getElementById('logout-button').addEventListener('click', handleLogout);
            
            mobileAuthContainer.innerHTML = `<div class="text-center"><span class="block text-sm mb-2">${state.currentUser.email}</span><button id="mobile-logout-button" class="btn btn-danger w-full">Logout</button></div>`;
            document.getElementById('mobile-logout-button').addEventListener('click', handleLogout);

            navLibrary.classList.remove('hidden');
            navWishlist.classList.remove('hidden');
            mobileNavLibrary.classList.remove('hidden');
            mobileNavWishlist.classList.remove('hidden');
        } else {
            authContainer.innerHTML = `<a href="#login" class="btn btn-secondary">Login</a>`;
            mobileAuthContainer.innerHTML = `<a href="#login" class="btn btn-secondary w-full">Login</a>`;
            navLibrary.classList.add('hidden');
            navWishlist.classList.add('hidden');
            mobileNavLibrary.classList.add('hidden');
            mobileNavWishlist.classList.add('hidden');
        }
        renderLibrary();
        renderWishlist();
    }

    function renderBookGrid() {
        const bookGrid = document.getElementById('book-grid');
        if (!bookGrid) return;
        bookGrid.innerHTML = state.currentSearchResults.map(book => renderBookCard(book)).join('');
    }
    
    function renderBookCard(book, options = {}) {
        const { isOwned = false, fromWishlist = false } = options;
        const price = (book.price_in_cents / 100).toFixed(2);

        let actionButton;
        if (isOwned) {
            actionButton = `<p class="text-center text-emerald-400 font-semibold py-2">In Your Library</p>`;
        } else if (fromWishlist) {
            actionButton = `<button data-price-id="${book.stripe_price_id}" data-book-id="${book.id}" class="btn btn-primary w-full purchase-btn">Buy for $${price}</button>`;
        } else {
            actionButton = `<a href="#book/${book.id}" class="btn btn-secondary w-full">$${price}</a>`;
        }

        const inWishlist = state.currentUser?.wishlist.includes(book.id);
        const wishlistButton = !isOwned && state.isLoggedIn ? `
            <button class="wishlist-btn absolute top-3 right-3" data-book-id="${book.id}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="${inWishlist ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 pointer-events-none ${inWishlist ? 'text-rose-500' : ''}">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            </button>` : '';

        return `
            <div class="book-card flex flex-col">
                <a href="#book/${book.id}">
                    <img src="${book.cover_image_url}" alt="Cover of ${book.title}" class="w-full h-72 object-cover">
                </a>
                ${wishlistButton}
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="font-bold text-lg truncate text-white">${book.title}</h3>
                    <p class="text-sm text-gray-400 mb-4">${book.author}</p>
                    <div class="mt-auto">${actionButton}</div>
                </div>
            </div>`;
    }

    function renderBookDetail(bookId) {
        const book = state.books.find(b => b.id === bookId);
        const detailPage = document.getElementById('book-detail-page');
        if (!book) {
            detailPage.innerHTML = `<p class="text-center">Book not found. <a href="#browse" class="text-indigo-400">Return to browse</a>.</p>`; return;
        }

        const isOwned = state.currentUser?.library.includes(book.id);
        const inWishlist = state.currentUser?.wishlist.includes(book.id);
        
        let actionButtons;
        if (!state.isLoggedIn) {
            actionButtons = `<a href="#login" class="btn btn-primary w-full sm:w-auto">Login to Purchase</a>`;
        } else if (isOwned) {
            actionButtons = `<p class="text-emerald-400 font-semibold text-lg py-3">You own this book!</p>`;
        } else {
            const wishlistBtnText = inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist';
            actionButtons = `
                <button id="purchase-button" data-price-id="${book.stripe_price_id}" data-book-id="${book.id}" class="btn btn-primary w-full sm:w-auto">Buy Now</button>
                <button id="wishlist-detail-btn" data-book-id="${book.id}" class="btn btn-secondary w-full sm:w-auto">${wishlistBtnText}</button>
            `;
        }
        
        detailPage.innerHTML = `
            <a class="nav-link text-indigo-400 mb-6 inline-block hover:underline" href="#browse">&larr; Back to Collection</a>
            <div class="flex flex-col md:flex-row gap-8">
                <img src="${book.cover_image_url.replace('zoom=1', 'zoom=0')}" alt="${book.title}" class="w-full md:w-1/3 rounded-md shadow-md object-cover">
                <div class="flex-1">
                    <h2 class="text-4xl font-bold text-white">${book.title}</h2>
                    <p class="text-xl text-gray-400 mt-1 mb-4">by ${book.author}</p>
                    <p class="text-gray-300 leading-relaxed mb-6">${book.description}</p>
                    <div class="mt-auto flex flex-col sm:flex-row gap-4">${actionButtons}</div>
                </div>
            </div>`;
        
        const purchaseBtn = document.getElementById('purchase-button');
        if (purchaseBtn) purchaseBtn.addEventListener('click', handlePurchase);
        const wishlistBtn = document.getElementById('wishlist-detail-btn');
        if (wishlistBtn) wishlistBtn.addEventListener('click', (e) => toggleWishlist(e.target.dataset.bookId));
    }
    
    function renderLibrary() {
        const libraryGrid = document.getElementById('library-grid');
        const libraryEmpty = document.getElementById('library-empty');
        if (!state.currentUser) {
             libraryGrid.classList.add('hidden'); libraryEmpty.classList.remove('hidden'); return;
        }
        const ownedBooks = state.currentUser.library.map(id => state.books.find(b => b.id === id)).filter(Boolean);
        if (ownedBooks.length > 0) {
            libraryGrid.innerHTML = ownedBooks.map(book => renderBookCard(book, { isOwned: true })).join('');
            libraryGrid.classList.remove('hidden'); libraryEmpty.classList.add('hidden');
        } else {
            libraryGrid.classList.add('hidden'); libraryEmpty.classList.remove('hidden');
        }
    }

    function renderWishlist() {
        const wishlistGrid = document.getElementById('wishlist-grid');
        const wishlistEmpty = document.getElementById('wishlist-empty');
        if (!state.currentUser) {
             wishlistGrid.classList.add('hidden'); wishlistEmpty.classList.remove('hidden'); return;
        }
        const wishlistedBooks = state.currentUser.wishlist.map(id => state.books.find(b => b.id === id)).filter(Boolean);
        if (wishlistedBooks.length > 0) {
            wishlistGrid.innerHTML = wishlistedBooks.map(book => renderBookCard(book, { fromWishlist: true })).join('');
            wishlistGrid.classList.remove('hidden'); wishlistEmpty.classList.add('hidden');
        } else {
            wishlistGrid.classList.add('hidden'); wishlistEmpty.classList.remove('hidden');
        }
    }

    // --- EVENT HANDLERS & ACTIONS ---
    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            if (!user.library) user.library = [];
            if (!user.wishlist) user.wishlist = [];
            
            setCurrentUser(user);
            updateUI();
            window.location.hash = '#browse';
        } else {
            showNotification("Invalid email or password.");
        }
    }

    function handleSignup(e) {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        if (password !== confirmPassword) { showNotification("Passwords do not match."); return; }
        const users = getUsers();
        if (users.find(u => u.email === email)) { showNotification("An account with this email already exists."); return; }
        const newUser = { email, password, library: [], wishlist: [] };
        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser);
        updateUI();
        window.location.hash = '#browse';
        showNotification("Account created successfully!");
    }

    function handleLogout() {
        setCurrentUser(null);
        updateUI();
        window.location.hash = '#home';
    }

    function handlePurchase(e) {
        const { priceId, bookId } = e.target.dataset;
        showNotification("Redirecting to checkout...");
        stripe.redirectToCheckout({
            lineItems: [{ price: priceId, quantity: 1 }],
            mode: 'payment',
            successUrl: `${window.location.origin}${window.location.pathname}?stripe_success=true&book_id=${bookId}`,
            cancelUrl: `${window.location.origin}${window.location.pathname}#book/${bookId}`,
        }).then(result => {
            if (result.error) { showNotification(result.error.message); }
        });
    }

    function handleSearch(e) {
        e.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        if (query) fetchBooks(query);
    }

    function addBookToLibrary(bookId) {
        if (!state.currentUser || state.currentUser.library.includes(bookId)) return;
        
        state.currentUser.library.push(bookId);

        const wishlistIndex = state.currentUser.wishlist.indexOf(bookId);
        if(wishlistIndex > -1) {
            state.currentUser.wishlist.splice(wishlistIndex, 1);
        }

        setCurrentUser(state.currentUser);
        
        const users = getUsers();
        const userIndex = users.findIndex(u => u.email === state.currentUser.email);
        if (userIndex !== -1) {
            users[userIndex] = state.currentUser;
            saveUsers(users);
        }
    }
    
    function toggleWishlist(bookId) {
        if (!state.currentUser) { showNotification("Please log in to use the wishlist."); return; }
        
        const user = state.currentUser;
        const wishlistIndex = user.wishlist.indexOf(bookId);
        
        if (wishlistIndex > -1) {
            user.wishlist.splice(wishlistIndex, 1);
        } else {
            user.wishlist.push(bookId);
        }
        
        setCurrentUser(user);
        
        const users = getUsers();
        const userIndex = users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
            users[userIndex] = user;
            saveUsers(users);
        }

        // Re-render whatever view is currently active
        handleHashChange();
    }

    // --- NOTIFICATIONS ---
    const modal = document.getElementById('notification-modal');
    const modalMessage = document.getElementById('notification-message');
    const modalClose = document.getElementById('notification-close');

    function showNotification(message) {
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
    }
    modalClose.addEventListener('click', () => modal.classList.add('hidden'));
    
    // --- INITIALIZATION ---
    function init() {
        setCurrentUser(getCurrentUser());
        
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('book_id');
        if (urlParams.get('stripe_success') && bookId) {
            addBookToLibrary(bookId);
            showNotification('Purchase successful! The book is now in your library.');
            window.history.replaceState({}, document.title, window.location.pathname + '#library');
        } else if(urlParams.has('stripe_success')) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }

        window.addEventListener('hashchange', handleHashChange);
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('signup-form').addEventListener('submit', handleSignup);
        document.getElementById('search-form').addEventListener('submit', handleSearch);
        document.getElementById('mobile-menu-button').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

        document.body.addEventListener('click', function(e) {
            if (e.target.closest('.wishlist-btn')) {
                toggleWishlist(e.target.closest('.wishlist-btn').dataset.bookId);
            }
            if (e.target.closest('.purchase-btn')) {
                handlePurchase(e.target.closest('.purchase-btn'));
            }
        });

        fetchBooks();
        handleHashChange();
        updateUI();
    }

    init();
});
