import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      // Only allow robspain@gmail.com to authenticate
      const allowedEmails = ["robspain@gmail.com"];
      
      if (!profile.email || !allowedEmails.includes(profile.email.toLowerCase())) {
        throw new Error("Access denied. Only authorized administrators can log in.");
      }
      
      if (existingUserId) {
        return existingUserId;
      }
      
      return ctx.db.insert("users", {
        email: profile.email,
        name: profile.name,
        image: profile.image,
      });
    },
  },
});
