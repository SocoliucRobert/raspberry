"""Script de migrare rapidă — adaugă coloanele noi pentru Google OAuth."""
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Adaugă coloanele noi (dacă nu există deja)
    db.session.execute(
        text("ALTER TABLE utilizatori ADD COLUMN IF NOT EXISTS google_id VARCHAR(120)")
    )
    db.session.execute(
        text("ALTER TABLE utilizatori ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512)")
    )
    # Face parola opțională
    db.session.execute(
        text("ALTER TABLE utilizatori ALTER COLUMN parola_hash DROP NOT NULL")
    )
    # Index unic pe google_id
    db.session.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_utilizatori_google_id ON utilizatori (google_id)"
        )
    )
    db.session.commit()
    print("✅ Migrare completă — coloanele google_id și avatar_url au fost adăugate.")
