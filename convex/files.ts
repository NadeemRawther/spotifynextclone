import { ConvexError, v } from "convex/values";
import {  mutation, query } from "./_generated/server";
import { FileWithUrls } from "@/types";


export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized");

        const files = await ctx.db.query("files").collect();

        return Promise.all(
            files.map(async (file) => {
                const songUrl = await ctx.storage.getUrl(file.song);
                let imageUrl: string | null = null;
                if (file.image) {
                    imageUrl = await ctx.storage.getUrl(file.image);
                }

                const user = await ctx.db
                    .query("users")
                    .withIndex("by_token", (q) =>
                        q.eq("tokenIdentifier", identity.tokenIdentifier))
                    .unique();

                if (user === null) {
                    throw new ConvexError("User doesn't exist in the database");
                }


                const favorite = await ctx.db
                    .query("userFavorites")
                    .withIndex("by_user_file", (q) =>
                        q
                            .eq("userId", user._id)
                            .eq("fileId", file._id)
                    )
                    .unique();

                const owner = await ctx.db.get(file.ownerId);

                return {
                    ...file,
                    songUrl,
                    imageUrl,
                    owner,
                    favorite: favorite ? true : false,
                } as FileWithUrls;
            })
        );
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx, args) => {
        return await ctx.storage.generateUploadUrl();
    },
});




export const saveSongStorageId = mutation({
    // You can customize these as you like
    args: {
        songStorageId: v.id("_storage"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new ConvexError("User not found.");
        }

        // Save the storageId to the database using `insert`

        return await ctx.db.insert("files", {
            song: args.songStorageId,
            ownerId: user._id,
            title: args.title,
        });
    },
});
export const saveImageStorageId = mutation({
    args: {
        imageStorageId: v.id("_storage"),
        id: v.id("files"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new ConvexError("User not found.");
        }

        // Save the storageId to the database using `update`

        return await ctx.db.patch(args.id, {
            image: args.imageStorageId,
        });
    },
});
