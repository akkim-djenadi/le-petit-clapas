const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

module.exports = (passport) => {
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user || !user.password_hash) return done(null, false, { message: 'Identifiants invalides' });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return done(null, false, { message: 'Identifiants invalides' });
      return done(null, user);
    } catch (err) { return done(err); }
  }));

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ where: { google_id: profile.id } });
      if (!user) {
        user = await User.findOne({ where: { email } });
        if (user) {
          await user.update({ google_id: profile.id, avatar_url: profile.photos[0]?.value });
        } else {
          user = await User.create({
            email,
            google_id: profile.id,
            name: profile.displayName,
            avatar_url: profile.photos[0]?.value,
          });
        }
      }
      return done(null, user);
    } catch (err) { return done(err); }
  }));
};
