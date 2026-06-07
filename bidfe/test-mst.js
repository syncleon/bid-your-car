const { types, cast } = require("mobx-state-tree");

const ItemModel = types.model("Item", {
    id: types.identifier,
    auctionId: types.maybeNull(types.string),
    auction: types.frozen()
});

try {
    const item = ItemModel.create({ id: "123", auctionId: "abc" });
    console.log("Success:", item.toJSON());
} catch (err) {
    console.log("Error:", err.message);
}
