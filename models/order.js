import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    username: { type: String, required: true },
    products: [{ type: String, required: true }]
});

export const Order = mongoose.model('Order', orderSchema);
