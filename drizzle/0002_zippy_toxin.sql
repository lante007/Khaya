CREATE TABLE `credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('referral','reward','bonus','deduction') NOT NULL,
	`description` text,
	`relatedReferralId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredId` int,
	`referredEmail` varchar(320),
	`referredPhone` varchar(20),
	`status` enum('pending','completed','rewarded') NOT NULL DEFAULT 'pending',
	`referralCode` varchar(20) NOT NULL,
	`rewardAmount` int NOT NULL DEFAULT 5000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`type` enum('success','testimonial','tip','experience') NOT NULL DEFAULT 'testimonial',
	`featured` boolean NOT NULL DEFAULT false,
	`likes` int NOT NULL DEFAULT 0,
	`relatedJobId` int,
	`relatedWorkerId` int,
	`mediaUrl` text,
	`approved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stories_id` PRIMARY KEY(`id`)
);
