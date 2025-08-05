-- CreateTable
CREATE TABLE "public"."collaboration_settings" (
    "id" SERIAL NOT NULL,
    "is_globally_enabled" BOOLEAN NOT NULL DEFAULT true,
    "global_disabled_until" TIMESTAMP(3),
    "global_disabled_reason" TEXT,
    "note_id" INTEGER,
    "is_note_enabled" BOOLEAN NOT NULL DEFAULT true,
    "note_disabled_until" TIMESTAMP(3),
    "note_disabled_reason" TEXT,
    "max_collaborators" INTEGER NOT NULL DEFAULT 10,
    "allow_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "require_approval" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "collaboration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collaboration_sessions" (
    "id" SERIAL NOT NULL,
    "note_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "socket_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operations_count" INTEGER NOT NULL DEFAULT 0,
    "characters_typed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "collaboration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collaboration_settings_note_id_key" ON "public"."collaboration_settings"("note_id");

-- AddForeignKey
ALTER TABLE "public"."collaboration_settings" ADD CONSTRAINT "collaboration_settings_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_settings" ADD CONSTRAINT "collaboration_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
