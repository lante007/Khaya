CREATE TABLE `bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`workerId` int NOT NULL,
	`amount` int NOT NULL,
	`timeline` int NOT NULL,
	`proposal` text NOT NULL,
	`status` enum('pending','accepted','rejected','withdrawn') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`budget` int NOT NULL,
	`location` varchar(200) NOT NULL,
	`buyerId` int NOT NULL,
	`status` enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
	`selectedBidId` int,
	`startDate` timestamp,
	`completionDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`price` int NOT NULL,
	`unit` varchar(50) NOT NULL,
	`stock` int NOT NULL,
	`photoUrl` text,
	`supplierId` int NOT NULL,
	`location` varchar(200) NOT NULL,
	`available` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`jobId` int,
	`content` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`proofUrl` text,
	`status` enum('pending','submitted','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`type` enum('bid','job','review','message','system') NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`trade` varchar(100),
	`location` varchar(200) NOT NULL,
	`photoUrl` text,
	`certifications` text,
	`trustScore` int NOT NULL DEFAULT 0,
	`verified` boolean NOT NULL DEFAULT false,
	`availabilityStatus` enum('available','busy','unavailable') DEFAULT 'available',
	`yearsExperience` int,
	`completedJobs` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`reviewerId` int NOT NULL,
	`reviewedId` int NOT NULL,
	`jobId` int,
	`type` enum('worker','buyer','supplier') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('buyer','worker','supplier','admin') NOT NULL DEFAULT 'buyer';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);