# BookSphere - An Online Bookstore

Welcome to BookSphere! This is a feature-rich, front-end web application that serves as a modern online bookstore. Users can discover, search, save, and purchase digital books from a vast library. The entire experience is built with foundational web technologies and integrates live, third-party APIs for real-time data and secure payment processing.

**Live Demo Link:** https://book-sphere-aaryarai185.vercel.app/


## ✨ Core Features

* **Full User Authentication:** A complete, persistent sign-up and login system. User data is saved in the browser's local storage to simulate a real-world database experience.
* **Live Stripe Payments:** Securely processes payments by redirecting users to a **Stripe Checkout** session, using test keys for a safe demonstration.
* **Dynamic Book Data via Google Books API:** Fetches and displays a vast collection of books in real-time from the Google Books API.
* **Powerful Book Search:** Users can search the entire Google Books library to find specific titles or authors.
* **Personal Wishlist:** Logged-in users can save books they are interested in to a persistent personal wishlist.
* **User Library:** After a successful purchase, books are automatically added to the user's private library.
* **Fully Responsive Design:** The interface is clean, modern, and built with Tailwind CSS to be fully functional on devices of all sizes, from mobile phones to desktops.

---

## 📸 Screenshots

Here are a few snapshots of the application in action.

#### **Homepage & Book Browsing**

*The main landing page and the dynamic grid of books fetched from the API.*

<img width="1440" height="722" alt="Screenshot 2025-08-29 at 23 47 55" src="https://github.com/user-attachments/assets/727b6c25-fd62-46c8-a691-0d1ab888cf01" />


#### **User Authentication (Login & Signup)**

*Clean, simple forms for user account creation and login.*

<img width="1440" height="727" alt="Screenshot 2025-08-29 at 23 48 22" src="https://github.com/user-attachments/assets/804416d7-1bbb-4fcb-9f58-48c1932c33d4" />


#### **Wishlist & User Library**

*Personalized pages for users to manage their saved and purchased books.*

<img width="1440" height="727" alt="Screenshot 2025-08-29 at 23 50 39" src="https://github.com/user-attachments/assets/34a5771e-e41d-429c-aecc-2a1ca8895766" />


#### **Secure Stripe Checkout**

*The secure, Stripe-hosted page where users complete their purchase.*

<img width="1440" height="710" alt="Screenshot 2025-08-29 at 23 52 10" src="https://github.com/user-attachments/assets/c1ff0b5c-bc55-457a-bf4c-e1330591f556" />


## 🛠️ Tech Stack

This project was built using only front-end technologies to demonstrate core web development skills.

* **Core:** HTML5, CSS3, JavaScript (ES6+)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **APIs:**
    * [Google Books API](https://developers.google.com/books) for fetching book data.
    * [Stripe.js](https://stripe.com/docs/js) for handling secure payment redirection.

---

## 🚀 How to Run This Project

To run this project locally, follow these simple steps:

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/booksphere.git](https://github.com/your-username/booksphere.git)
    ```

2.  **Navigate to the Directory**
    ```bash
    cd booksphere
    ```

3.  **Set Up API Keys (Required)**
    This project requires API keys from Google and Stripe to function. Open the `script.js` file and replace the placeholder keys at the top with your own:

    * **Google Books API Key:**
        * Go to the [Google Cloud Console](https://console.cloud.google.com/apis/library/books.googleapis.com).
        * Create a project and enable the "Books API".
        * Go to "Credentials" and create a new API key.
        * Paste this key into the `GOOGLE_BOOKS_API_KEY` variable.

    * **Stripe Keys:**
        * Log in to your [Stripe Dashboard](https://dashboard.stripe.com/).
        * Make sure you are in **Test Mode**.
        * Get your **Publishable Key** (`pk_test_...`) and paste it into the `STRIPE_PUBLISHABLE_KEY` variable.
        * Go to the "Products" tab, create a new product (e.g., "E-Book"), and get its **Price ID** (`price_...`).
        * Replace the placeholder IDs in the `MOCK_STRIPE_PRICE_IDS` array with your new Price ID.

4.  **Open in Browser**
    Simply open the `index.html` file in any modern web browser.
