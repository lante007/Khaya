-- Wave broadcasting table
CREATE TABLE IF NOT EXISTS `waves` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jobId` int NOT NULL,
  `workerId` int NOT NULL,
  `waveNumber` int NOT NULL,
  `status` enum('sent','seen','accepted','declined','expired') NOT NULL DEFAULT 'sent',
  `sentAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `respondedAt` timestamp NULL,
  `expiresAt` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_waves_job` (`jobId`),
  KEY `idx_waves_worker` (`workerId`),
  KEY `idx_waves_job_status` (`jobId`, `status`)
);

-- Worker skills table (replaces single profiles.trade string)
CREATE TABLE IF NOT EXISTS `worker_skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workerId` int NOT NULL,
  `skill` varchar(100) NOT NULL,
  `grade` enum('Bronze','Silver','Gold','Platinum') NOT NULL DEFAULT 'Bronze',
  `verifiedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_worker_skill_unique` (`workerId`, `skill`),
  KEY `idx_worker_skills_worker` (`workerId`)
);
