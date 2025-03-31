firebase.auth().onAuthStateChanged(user => {
  if (user) {
    const cartRef = db.collection("users").doc(user.uid).collection("cart");
    const cartItemsContainer = document.getElementById("cart-items");
    const productDetailContainer = document.getElementById("product-details-block");

    cartRef.onSnapshot(snapshot => {
      cartItemsContainer.innerHTML = "";
      let subtotal = 0;

      if (snapshot.empty) {
        cartItemsContainer.innerHTML = `<p class="text-muted">Your cart is empty.</p>`;
        productDetailContainer.innerHTML = `<p class="text-muted">Click on a product to view details.</p>`;
        document.getElementById("subtotal").textContent = "0.00";
        document.getElementById("total").textContent = "0.00";
        return;
      }

      snapshot.forEach(doc => {
        const item = doc.data();
        const quantity = item.quantity || 1;
        const totalPrice = (item.price || 0) * quantity;
        subtotal += totalPrice;

        const card = document.createElement("div");
        card.classList.add("card", "p-3", "position-relative");

        card.innerHTML = `
          <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 remove-btn">
            <i class="fas fa-times"></i>
          </button>
          <div class="d-flex align-items-center product-click" style="cursor: pointer;">
            <img src="data:image/png;base64,${item.image}" alt="${item.name}" width="80" class="me-3 rounded" />
            <div>
              <h6 class="mb-1">${item.name}</h6>
              <div class="d-flex align-items-center">
                <button class="btn btn-sm btn-outline-secondary decrease">−</button>
                <span class="mx-2">${quantity}</span>
                <button class="btn btn-sm btn-outline-secondary increase">+</button>
              </div>
            </div>
          </div>
        `;

        // Click to show product details
        card.querySelector(".product-click").addEventListener("click", () => {
          showProductDetails(doc.id);
        });

        // Quantity increment
        card.querySelector(".increase").addEventListener("click", () => {
          cartRef.doc(doc.id).update({
            quantity: firebase.firestore.FieldValue.increment(1)
          });
        });

        // Quantity decrement (min 1)
        card.querySelector(".decrease").addEventListener("click", () => {
          if (quantity > 1) {
            cartRef.doc(doc.id).update({
              quantity: firebase.firestore.FieldValue.increment(-1)
            });
          }
        });

        // Remove item
        card.querySelector(".remove-btn").addEventListener("click", () => {
          cartRef.doc(doc.id).delete();
        });

        cartItemsContainer.appendChild(card);
      });

      document.getElementById("subtotal").textContent = subtotal.toFixed(2);
      document.getElementById("total").textContent = subtotal.toFixed(2);
    });
  }
});

// Show full product details (without price)
function showProductDetails(productID) {
  db.collection("posts").doc(productID).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const container = document.getElementById("product-details-block");

      container.innerHTML = `
        <h5><strong>${data.name || "Untitled"}</strong></h5>
        <p>${data.details || "No description available."}</p>
        <p><strong>Location:</strong> ${data.location || "Unknown"}</p>
        <p><strong>Prescription:</strong> ${data.prescription || "N/A"}</p>
        <p><strong>Type:</strong> ${data.category || "N/A"}</p>
        <p><strong>Contact:</strong> ${data.email || "N/A"}</p>
      `;
    } else {
      document.getElementById("product-details-block").innerHTML = `<p class="text-danger">Failed to load product info.</p>`;
    }
  }).catch(err => {
    document.getElementById("product-details-block").innerHTML = `<p class="text-danger">Error: ${err.message}</p>`;
  });
}
