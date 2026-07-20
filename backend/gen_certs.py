from app.core.database import engine
from app.certificates.pdf_generator import PDFGenerator
from sqlalchemy import text
from datetime import datetime
import uuid, os

gen = PDFGenerator()
cert_dir = "storage/certificates"

with engine.connect() as c:
    existing = set()
    for row in c.execute(text("SELECT recipient_id, certificate_type FROM certificates")):
        existing.add((row[0], row[1]))

    authors = c.execute(text("SELECT u.id, a.first_name, a.last_name FROM authors a JOIN users u ON a.user_id=u.id")).fetchall()
    reviewers = c.execute(text("SELECT u.id, r.first_name, r.last_name FROM reviewers r JOIN users u ON r.user_id=u.id")).fetchall()
    admin_id = c.execute(text("SELECT id FROM users WHERE email='admin@spsu.ac.in'")).fetchone()[0]
    now = datetime.now()
    ds = now.strftime("%Y%m%d")
    created = 0

    for uid, first, last in authors:
        if (uid, "subscription") in existing:
            continue
        cert_id = "CERT-" + ds + "-" + uuid.uuid4().hex[:8].upper()
        name = (first + " " + last).strip()
        c.execute(text("INSERT INTO certificates (id,certificate_id,certificate_type,recipient_id,recipient_name,issued_date,subscription_date,role,created_at,created_by,download_count) VALUES (:id,:cid,:ct,:rid,:rn,:isd,:sd,:role,:ca,:cb,0)"),
            {"id":str(uuid.uuid4()),"cid":cert_id,"ct":"subscription","rid":uid,"rn":name,"isd":now,"sd":now,"role":"author","ca":now,"cb":admin_id})
        pdf = gen.generate_subscription_certificate({"recipient_name":name,"subscription_date":now,"certificate_id":cert_id,"issued_date":now,"role":"author"})
        with open(os.path.join(cert_dir, cert_id + ".pdf"), "wb") as f:
            f.write(pdf)
        print("  Author:", name, "->", cert_id)
        created += 1

    for uid, first, last in reviewers:
        if (uid, "subscription") in existing:
            continue
        cert_id = "CERT-" + ds + "-" + uuid.uuid4().hex[:8].upper()
        name = (first + " " + last).strip()
        c.execute(text("INSERT INTO certificates (id,certificate_id,certificate_type,recipient_id,recipient_name,issued_date,subscription_date,role,created_at,created_by,download_count) VALUES (:id,:cid,:ct,:rid,:rn,:isd,:sd,:role,:ca,:cb,0)"),
            {"id":str(uuid.uuid4()),"cid":cert_id,"ct":"subscription","rid":uid,"rn":name,"isd":now,"sd":now,"role":"reviewer","ca":now,"cb":admin_id})
        pdf = gen.generate_subscription_certificate({"recipient_name":name,"subscription_date":now,"certificate_id":cert_id,"issued_date":now,"role":"reviewer"})
        with open(os.path.join(cert_dir, cert_id + ".pdf"), "wb") as f:
            f.write(pdf)
        print("  Reviewer:", name, "->", cert_id)
        created += 1

    c.commit()
    total = c.execute(text("SELECT COUNT(*) FROM certificates")).scalar()
    pdfs = len([f for f in os.listdir(cert_dir) if f.endswith(".pdf")])
    print("\nCreated:", created, "new")
    print("Total DB:", total)
    print("Total PDFs:", pdfs)
