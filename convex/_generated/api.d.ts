/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as collection from "../collection.js";
import type * as collectionModel from "../collectionModel.js";
import type * as collectionWrites from "../collectionWrites.js";
import type * as lastFm from "../lastFm.js";
import type * as packModel from "../packModel.js";
import type * as packTags from "../packTags.js";
import type * as packs from "../packs.js";
import type * as songs from "../songs.js";
import type * as userModel from "../userModel.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  collection: typeof collection;
  collectionModel: typeof collectionModel;
  collectionWrites: typeof collectionWrites;
  lastFm: typeof lastFm;
  packModel: typeof packModel;
  packTags: typeof packTags;
  packs: typeof packs;
  songs: typeof songs;
  userModel: typeof userModel;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
