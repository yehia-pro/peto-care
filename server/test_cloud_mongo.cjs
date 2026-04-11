const mongoose = require('mongoose');

const uri = 'mongodb+srv://euphoriapetocare_db_user:2009200613@cluster0.adpudw0.mongodb.net/peto-care?appName=Cluster0';

mongoose.connect(uri).then(async () => {
    const PetStore = mongoose.connection.collection('petstores');
    const stores = await PetStore.find({}).toArray();
    stores.forEach(s => {
        if(s.products && s.products.length > 0) {
            console.log("===", s.storeName, "===");
            s.products.forEach(p => console.log("  -", p.name, "URL:", p.imageUrl));
        }
    });

    // Check products collection just in case
    try {
        const Products = mongoose.connection.collection('products');
        const prods = await Products.find({}).toArray();
        if(prods.length > 0) {
            console.log("\n=== standalone products ===");
            prods.forEach(p => console.log("  -", p.name, "URL:", p.imageUrl));
        }
    } catch(e) {}

    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
