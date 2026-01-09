CREATE TABLE `ai_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`post_id` integer,
	`action` text NOT NULL,
	`provider` text DEFAULT 'cloudflare' NOT NULL,
	`tokens_input` integer,
	`tokens_output` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`ip_address` text,
	`message` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`sender_email` text NOT NULL,
	`spam` integer DEFAULT false NOT NULL,
	`subject` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`user_id` integer,
	`status` text DEFAULT 'subscribed' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`confirmed_at` text,
	`resend_message_id` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `post_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`pathname` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text,
	`size` integer,
	`in_use` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_images_pathname_unique` ON `post_images` (`pathname`);--> statement-breakpoint
CREATE TABLE `post_tags` (
	`post_id` integer NOT NULL,
	`tag_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `post_videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`pathname` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text,
	`size` integer,
	`poster_path` text,
	`poster_filename` text,
	`in_use` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_videos_pathname_unique` ON `post_videos` (`pathname`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`blob_path` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`description` text,
	`image_alt` text,
	`image_ext` text,
	`image_src` text,
	`language` text DEFAULT 'en' NOT NULL,
	`links` text DEFAULT '{}' NOT NULL,
	`metrics_comments` integer DEFAULT 0 NOT NULL,
	`metrics_likes` integer DEFAULT 0 NOT NULL,
	`metrics_views` integer DEFAULT 0 NOT NULL,
	`name` text NOT NULL,
	`published_at` text,
	`slug` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`user_id` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_settings_key_unique` ON `site_settings` (`key`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`avatar` text DEFAULT '' NOT NULL,
	`biography` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`job` text DEFAULT '' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`last_login_at` text,
	`location` text DEFAULT '' NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`password` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`socials` text DEFAULT '[]' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_name_unique` ON `users` (`name`);