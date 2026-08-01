export const PRISMA_SCHEMA = `// Prisma Schema for Recura Digital Subscription Reseller ERP

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Language {
  AR
  FR
  EN
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRING_7D
  EXPIRING_3D
  EXPIRED
}

enum CustomerStatus {
  ACTIVE
  BLOCKED
  INACTIVE
}

enum UserRole {
  ADMIN
  AGENT
}

model User {
  id            String      @id @default(uuid())
  name          String
  username      String      @unique
  email         String      @unique
  passwordHash  String
  role          UserRole    @default(ADMIN)
  mfaEnabled    Boolean     @default(false)
  currency      String      @default("USD ($)")
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  auditLogs     AuditLog[]
  sessions      Session[]
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  token        String   @unique
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Customer {
  id                String         @id @default(uuid())
  name              String
  whatsapp          String         @unique
  email             String?
  preferredLanguage Language       @default(AR)
  status            CustomerStatus @default(ACTIVE)
  notes             String?
  isDeleted         Boolean        @default(false)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  orders            Order[]

  @@index([whatsapp])
  @@index([status])
}

model Plan {
  id              String   @id @default(uuid())
  name            String
  category        String
  price           Float
  durationMonths  Int
  notes           String?
  availableStock  Int      @default(0)
  totalAccounts   Int      @default(0)
  isDeleted       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  orders          Order[]
}

model Order {
  id                       String             @id @default(uuid())
  orderNumber              Int?
  customerId               String
  planId                   String
  price                    Float
  durationMonths           Int
  startDate                DateTime
  endDate                  DateTime
  status                   SubscriptionStatus @default(ACTIVE)
  accountEmail             String
  accountPasswordEncrypted String
  pinCodeEncrypted         String?
  screenProfileName        String?
  notes                    String?
  contactedForRenewal      Boolean            @default(false)
  contactedAt              DateTime?
  serviceAccountId         String?
  profileNumber            Int?
  isDeleted                Boolean            @default(false)
  createdAt                DateTime           @default(now())
  updatedAt                DateTime           @updatedAt

  customer                 Customer           @relation(fields: [customerId], references: [id])
  plan                     Plan               @relation(fields: [planId], references: [id])
  serviceAccount           ServiceAccount?    @relation(fields: [serviceAccountId], references: [id])
  alertLogs                AlertLog[]

  @@index([customerId])
  @@index([endDate])
  @@index([status])
  @@index([serviceAccountId])
  @@unique([serviceAccountId, profileNumber])
}

model ServiceAccount {
  id               String   @id @default(uuid())
  serviceType      String
  providerId       String?
  email            String
  password         String?
  subscriptionStart DateTime
  subscriptionEnd  DateTime
  purchaseCost     Float    @default(0)
  capacity         Int      @default(1)
  status           String   @default("Active")
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  orders           Order[]

  @@index([status])
  @@index([subscriptionEnd])
}

model AlertLog {
  id          String   @id @default(uuid())
  orderId     String
  whatsapp    String
  language    Language
  sentMessage String
  contactedAt DateTime @default(now())

  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

model WhatsAppTemplate {
  language      String   @id
  expiring3Days String   @default("")
  expired       String   @default("")
  updatedAt     DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  userEmail String
  action    String
  details   String
  ipAddress String
  status    String   @default("SUCCESS")
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id])

  @@index([createdAt])
}

model MessageTemplate {
  id            String   @id @default(uuid())
  language      Language @unique
  expiring3Days String
  expired       String
  updatedAt     DateTime @updatedAt
}
`;

export const DATABASE_SQL = `-- Recura Digital Subscription Reseller ERP Database Dump
-- Compatible with PostgreSQL 13+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE "Language" AS ENUM ('AR', 'FR', 'EN');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRING_7D', 'EXPIRING_3D', 'EXPIRED');
-- CustomerStatus is VARCHAR(20) (not enum) — frontend TypeScript validates values.
-- Enum definition retained for reference only:
-- CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'INACTIVE', 'VIP');
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT');

-- Table: Users
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) UNIQUE NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" DEFAULT 'ADMIN',
    "mfaEnabled" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Customers
CREATE TABLE "Customer" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "whatsapp" VARCHAR(50) UNIQUE NOT NULL,
    "email" VARCHAR(255),
    "preferredLanguage" "Language" DEFAULT 'AR',
    "status" VARCHAR(20) DEFAULT 'ACTIVE',
    "notes" TEXT,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Plans
CREATE TABLE "Plan" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMonths" INT NOT NULL,
    "notes" TEXT,
    "availableStock" INT DEFAULT 0,
    "totalAccounts" INT DEFAULT 0,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Orders
CREATE TABLE "Order" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "customerId" UUID NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT,
    "planId" UUID NOT NULL REFERENCES "Plan"("id") ON DELETE RESTRICT,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMonths" INT NOT NULL,
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" "SubscriptionStatus" DEFAULT 'ACTIVE',
    "accountEmail" VARCHAR(255) NOT NULL,
    "accountPasswordEncrypted" TEXT NOT NULL,
    "pinCodeEncrypted" VARCHAR(20),
    "screenProfileName" VARCHAR(100),
    "notes" TEXT,
    "contactedForRenewal" BOOLEAN DEFAULT FALSE,
    "contactedAt" TIMESTAMP WITH TIME ZONE,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX "idx_customer_whatsapp" ON "Customer"("whatsapp");
CREATE INDEX "idx_customer_status" ON "Customer"("status");
CREATE INDEX "idx_order_customer_id" ON "Order"("customerId");
CREATE INDEX "idx_order_end_date" ON "Order"("endDate");
CREATE INDEX "idx_order_status" ON "Order"("status");

-- Table: AuditLogs
CREATE TABLE "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "userEmail" VARCHAR(255) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Seed Admin Data
-- Seed uses a real Argon2id hash for the admin workspace account.
INSERT INTO "User" ("name", "username", "email", "passwordHash", "role")
VALUES ('James Noah', 'admin', 'admin@recura.io', '$argon2id$v=19$m=65536,t=3,p=1$QdiQ/RMZXNk4nbzGNtQcIA$rFFVNx7nm/b4xDGMLbB8JIU6GTIH1cI3KA+bRMXmI+E', 'ADMIN');
`;

export const DOCKER_COMPOSE = `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: recura_postgres
    environment:
      POSTGRES_USER: recura_admin
      POSTGRES_PASSWORD: recura_secure_password_2026
      POSTGRES_DB: recura_erp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database.sql:/docker-entrypoint-initdb.d/database.sql
    restart: always

volumes:
  postgres_data:
`;

export const SEED_TS = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Recura ERP database...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@recura.io' },
    update: {},
    create: {
      name: 'James Noah',
      username: 'admin',
      email: 'admin@recura.io',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$QdiQ/RMZXNk4nbzGNtQcIA$rFFVNx7nm/b4xDGMLbB8JIU6GTIH1cI3KA+bRMXmI+E',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
