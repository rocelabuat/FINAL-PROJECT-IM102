const pool = require("../db");

/** GET all products with stock info */
exports.getProductStock = async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT id, name, price, description, image, category FROM products ORDER BY id`
    );

    const [recipes] = await pool.query(`
      SELECT pr.product_id, pr.raw_material_id, pr.quantity_needed, rm.quantity AS stock
      FROM product_recipes pr
      JOIN raw_materials rm ON pr.raw_material_id = rm.id
    `);

    const productStock = products.map(product => {
      const productRecipes = recipes.filter(r => r.product_id === product.id);
      const maxStock = productRecipes.length > 0
        ? Math.floor(Math.min(...productRecipes.map(r => r.stock / r.quantity_needed)))
        : 999; // drinks or no recipe = unlimited
      const outOfStock = maxStock === 0;
      const lowStock = maxStock > 0 && maxStock < 10;

      return { ...product, stock: maxStock, outOfStock, lowStock };
    });

    res.json(productStock);
  } catch (err) {
    console.error("GET PRODUCT STOCK ERROR:", err);
    res.status(500).json({ message: "Failed to fetch product stock", error: err.message });
  }
};
