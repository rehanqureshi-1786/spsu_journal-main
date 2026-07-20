from app.core.database import engine
from sqlalchemy import text
with engine.connect() as c:
    rows = c.execute(text("SELECT id, title FROM papers WHERE title=:a OR title=:b OR title=:c"), {"a":"Test","b":"Test_1","c":"test"}).fetchall()
    for r in rows:
        pid = r[0]
        print(f"Removing paper: {r[1]}")
        c.execute(text("DELETE FROM reviews WHERE assignment_id IN (SELECT id FROM review_assignments WHERE paper_id=:p)"), {"p": pid})
        c.execute(text("DELETE FROM review_assignments WHERE paper_id=:p"), {"p": pid})
        c.execute(text("DELETE FROM publications WHERE paper_id=:p"), {"p": pid})
        c.execute(text("DELETE FROM paper_status_history WHERE paper_id=:p"), {"p": pid})
        c.execute(text("DELETE FROM papers WHERE id=:p"), {"p": pid})
    c.commit()
    print("\nRemaining:")
    for t in ["papers","publications","review_assignments","reviews"]:
        cnt = c.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        print(f"  {t}: {cnt}")
    for r in c.execute(text("SELECT title, status FROM papers")):
        print(f"  [{r[1]}] {r[0][:60]}")
