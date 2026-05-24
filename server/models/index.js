const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Subcategory = require('./Subcategory');
const Commerce = require('./Commerce');
const CommerceImage = require('./CommerceImage');
const Review = require('./Review');
const Favorite = require('./Favorite');
const Offer = require('./Offer');
const MerchantProfile = require('./MerchantProfile');
const CreditTransaction = require('./CreditTransaction');
const TicketOffer = require('./TicketOffer');
const UserTicket = require('./UserTicket');
const Game = require('./Game');
const Notification = require('./Notification');
const UserNotification = require('./UserNotification');
const PushSubscription = require('./PushSubscription');

// Catégories
Category.hasMany(Subcategory, { foreignKey: 'category_id', as: 'subcategories' });
Subcategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Commerces
Category.hasMany(Commerce, { foreignKey: 'category_id' });
Commerce.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Subcategory.hasMany(Commerce, { foreignKey: 'subcategory_id' });
Commerce.belongsTo(Subcategory, { foreignKey: 'subcategory_id', as: 'subcategory' });
Commerce.hasMany(CommerceImage, { foreignKey: 'commerce_id', as: 'images' });
CommerceImage.belongsTo(Commerce, { foreignKey: 'commerce_id' });
Commerce.hasMany(Review, { foreignKey: 'commerce_id', as: 'reviews' });
Commerce.hasMany(Offer, { foreignKey: 'commerce_id', as: 'offers' });
Commerce.hasMany(TicketOffer, { foreignKey: 'commerce_id', as: 'ticketOffers' });
Commerce.hasOne(MerchantProfile, { foreignKey: 'commerce_id' });

// Users
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(MerchantProfile, { foreignKey: 'user_id', as: 'merchantProfile' });
MerchantProfile.belongsTo(User, { foreignKey: 'user_id' });
MerchantProfile.belongsTo(Commerce, { foreignKey: 'commerce_id', as: 'commerce' });
User.hasMany(UserTicket, { foreignKey: 'user_id', as: 'tickets' });
UserTicket.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(PushSubscription, { foreignKey: 'user_id' });

// Favorites (many-to-many)
User.belongsToMany(Commerce, { through: Favorite, foreignKey: 'user_id', as: 'favorites' });
Commerce.belongsToMany(User, { through: Favorite, foreignKey: 'commerce_id' });

// TicketOffers & UserTickets
TicketOffer.hasMany(UserTicket, { foreignKey: 'ticket_offer_id', as: 'userTickets' });
UserTicket.belongsTo(TicketOffer, { foreignKey: 'ticket_offer_id', as: 'ticketOffer' });

// Games
Game.belongsTo(TicketOffer, { foreignKey: 'ticket_offer_id', as: 'ticketOffer' });
Game.belongsTo(User, { foreignKey: 'winner_id', as: 'winner' });

// Notifications
Notification.hasMany(UserNotification, { foreignKey: 'notification_id' });
UserNotification.belongsTo(Notification, { foreignKey: 'notification_id', as: 'notification' });
User.hasMany(UserNotification, { foreignKey: 'user_id' });

module.exports = {
  sequelize, User, Category, Subcategory, Commerce, CommerceImage,
  Review, Favorite, Offer, MerchantProfile, CreditTransaction,
  TicketOffer, UserTicket, Game, Notification, UserNotification, PushSubscription,
};
