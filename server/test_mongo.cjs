const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/vet_network').then(async () => {
    const PetStore = mongoose.connection.collection('petstores');
    const stores = await PetStore.find({}).toArray();
    stores.forEach(s => {
        if(s.products && s.products.length > 0) {
            console.log("===", s.storeName, "===");
            s.products.forEach(p => console.log("  -", p.name, "URL:", p.imageUrl));
        }
    });
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
