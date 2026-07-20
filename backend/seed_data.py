import uuid, os, shutil, json
from datetime import datetime, timedelta
from app.core.security import hash_password
from app.core.database import engine
from sqlalchemy import text

def uid(): return str(uuid.uuid4())

with engine.connect() as c:
    roles = {r[1]: r[0] for r in c.execute(text("SELECT id, name FROM roles"))}
    admin_id = c.execute(text("SELECT id FROM users WHERE email='admin@spsu.ac.in'")).fetchone()[0]

    # Get existing author IDs
    author_ids = {}
    for r in c.execute(text("SELECT a.id, u.email FROM authors a JOIN users u ON a.user_id=u.id")):
        author_ids[r[1]] = r[0]
    print(f"Authors: {len(author_ids)}")

    # REVIEWERS
    pw_rev = hash_password("Reviewer@123")
    revs = [
        ("Dr. Kamal Kant", "Hiran", "kamal.hiran@spsu.ac.in", ["Artificial Intelligence", "Machine Learning"]),
        ("Mr. Ashish", "Sen", "ashish.sen@spsu.ac.in", ["Data Science", "Big Data Analytics"]),
        ("Dr. Chandani", "Joshi", "chandani.joshi@spsu.ac.in", ["Software Engineering", "Cloud Computing"]),
        ("Dr. Rahul", "Kumar", "rahul.kumar@spsu.ac.in", ["Cybersecurity", "Network Security"]),
        ("Mr. Shubham", "Kumar", "shubham.kumar@spsu.ac.in", ["IoT", "Embedded Systems"]),
    ]
    reviewer_ids = {}
    for first, last, email, expertise in revs:
        ex = c.execute(text("SELECT id FROM users WHERE email=:e"), {"e": email}).fetchone()
        if ex:
            user_id = ex[0]
        else:
            user_id = uid()
            c.execute(text("INSERT INTO users (id,email,password_hash,role_id,is_active) VALUES (:id,:e,:pw,:r,1)"), {"id": user_id, "e": email, "pw": pw_rev, "r": roles["reviewer"]})
        ex2 = c.execute(text("SELECT id FROM reviewers WHERE user_id=:u"), {"u": user_id}).fetchone()
        if ex2:
            reviewer_ids[email] = ex2[0]
        else:
            rid = uid()
            c.execute(text("INSERT INTO reviewers (id,user_id,first_name,last_name,affiliation,expertise) VALUES (:id,:u,:f,:l,:a,:ex)"), {"id": rid, "u": user_id, "f": first, "l": last, "a": "Sir Padampat Singhania University", "ex": json.dumps(expertise)})
            reviewer_ids[email] = rid
        print(f"  Reviewer: {first} {last}")
    c.commit()

    # VOLUMES & ISSUES
    vol_ids = {}
    for vnum, year in [(1, 2025), (2, 2026)]:
        ex = c.execute(text("SELECT id FROM volumes WHERE volume_number=:v"), {"v": vnum}).fetchone()
        if ex: vol_ids[vnum] = ex[0]
        else:
            vid = uid()
            c.execute(text("INSERT INTO volumes (id,volume_number,year) VALUES (:id,:v,:y)"), {"id": vid, "v": vnum, "y": year})
            vol_ids[vnum] = vid

    issue_ids = {}
    for vn, inum, pd, t in [(1,1,"2025-06-15","June 2025"),(1,2,"2025-12-15","December 2025"),(2,1,"2026-03-15","March 2026")]:
        ex = c.execute(text("SELECT id FROM issues WHERE volume_id=:v AND issue_number=:i"), {"v": vol_ids[vn], "i": inum}).fetchone()
        if ex: issue_ids[(vn,inum)] = ex[0]
        else:
            iid = uid()
            c.execute(text("INSERT INTO issues (id,volume_id,issue_number,publication_date,title) VALUES (:id,:v,:i,:p,:t)"), {"id": iid, "v": vol_ids[vn], "i": inum, "p": pd, "t": t})
            issue_ids[(vn,inum)] = iid
        print(f"  Issue: Vol {vn} Issue {inum}")
    c.commit()

    # PAPERS
    sample = "/tmp/sample_paper.pdf"
    papers = [
        ("A Comprehensive Study on Machine Learning Algorithms for Predictive Analytics", "ashwani.sharma@spsu.ac.in", "Published", (1,1)),
        ("Blockchain-Based Secure Voting System: Design and Implementation", "harshita.maratha@spsu.ac.in", "Published", (1,1)),
        ("Impact of Digital Marketing on Consumer Behavior in Indian E-Commerce", "achyut.pancholi2@spsu.ac.in", "Published", (1,2)),
        ("IoT-Enabled Smart Agriculture: A Framework for Precision Farming", "rudraksh.sharma@spsu.ac.in", "Published", (1,2)),
        ("Deep Learning for Natural Language Processing in Hindi Text", "suhani.agarwal@spsu.ac.in", "Published", (2,1)),
        ("Sustainable Construction Materials: A Review of Green Building Technologies", "darshana.soni@spsu.ac.in", "Under Review", None),
        ("Cybersecurity Threat Detection Using Artificial Intelligence", "ashwani.sharma@spsu.ac.in", "Submitted", None),
        ("Financial Inclusion Through Mobile Banking in Rural Rajasthan", "harshita.maratha@spsu.ac.in", "Reviewer Assigned", None),
    ]
    abstracts = [
        "This paper presents a comprehensive study on various machine learning algorithms used for predictive analytics including decision trees, random forests, SVMs, and neural networks evaluated on benchmark datasets.",
        "This research proposes a blockchain-based electronic voting system ensuring transparency, immutability, and voter privacy using Ethereum smart contracts.",
        "This study examines digital marketing strategies impact on consumer purchasing behavior in Indian e-commerce through survey of 500 respondents.",
        "An IoT-enabled framework for precision agriculture integrating soil moisture sensors, weather data, and crop health monitoring with edge computing.",
        "This research explores deep learning approaches for NLP tasks in Hindi text including sentiment analysis, NER, and text summarization.",
        "A comprehensive review of sustainable construction materials and green building technologies analyzing environmental impact and cost-effectiveness.",
        "An AI-based cybersecurity threat detection system combining deep learning with behavioral analysis for real-time network monitoring.",
        "Investigation of mobile banking role in financial inclusion in rural Rajasthan through interviews with 300 households.",
    ]
    rev_list = list(reviewer_ids.values())

    for idx, (title, aemail, status, ikey) in enumerate(papers):
        if aemail not in author_ids:
            print(f"  SKIP: {aemail} not found")
            continue
        aid = author_ids[aemail]
        pid = uid()
        af = f"PAPER-{pid}-0001.pdf"
        shutil.copy2(sample, f"storage/manuscripts/{af}")
        sub = datetime.now() - timedelta(days=30 + idx * 15)
        kw = json.dumps(["research", "SPSU", title.split()[0].lower()])

        c.execute(text("INSERT INTO papers (id,author_id,title,abstract,keywords,original_filename,anonymized_filename,file_hash,status,submitted_at,updated_at) VALUES (:id,:aid,:t,:ab,:kw,:of,:af,:fh,:st,:sub,:upd)"),
            {"id":pid,"aid":aid,"t":title,"ab":abstracts[idx],"kw":kw,"of":"Research_Paper.pdf","af":af,"fh":uid()[:16],"st":status,"sub":sub,"upd":datetime.now()})
        c.execute(text("INSERT INTO paper_status_history (id,paper_id,status,changed_by,notes,changed_at) VALUES (:id,:pid,:st,:cb,:n,:ca)"),
            {"id":uid(),"pid":pid,"st":"Submitted","cb":admin_id,"n":"Paper submitted","ca":sub})

        if status == "Published" and ikey:
            vn, inum = ikey
            pd = f"storage/published/{vn}/{inum}"
            os.makedirs(pd, exist_ok=True)
            shutil.copy2(sample, f"{pd}/{af}")
            c.execute(text("INSERT INTO publications (id,paper_id,issue_id,published_at) VALUES (:id,:pid,:iid,:pa)"),
                {"id":uid(),"pid":pid,"iid":issue_ids[ikey],"pa":datetime.now()})
            c.execute(text("INSERT INTO paper_status_history (id,paper_id,status,changed_by,notes,changed_at) VALUES (:id,:pid,:st,:cb,:n,:ca)"),
                {"id":uid(),"pid":pid,"st":"Published","cb":admin_id,"n":"Published","ca":datetime.now()})
            ri = rev_list[idx % len(rev_list)]
            raid = uid()
            c.execute(text("INSERT INTO review_assignments (id,paper_id,reviewer_id,assigned_by,deadline,status,assigned_at) VALUES (:id,:pid,:rid,:ab,:dl,:st,:aa)"),
                {"id":raid,"pid":pid,"rid":ri,"ab":admin_id,"dl":datetime.now(),"st":"completed","aa":sub+timedelta(days=5)})
            c.execute(text("INSERT INTO reviews (id,assignment_id,recommendation,comments_for_author,comments_for_editor,submitted_at) VALUES (:id,:aid,:rec,:ca,:ce,:sa)"),
                {"id":uid(),"aid":raid,"rec":"accept","ca":"Well-written paper with solid methodology. Recommend publication.","ce":"Strong contribution. Accept.","sa":sub+timedelta(days=20)})

        elif status in ("Under Review", "Reviewer Assigned"):
            ri = rev_list[(idx+2) % len(rev_list)]
            raid = uid()
            c.execute(text("INSERT INTO review_assignments (id,paper_id,reviewer_id,assigned_by,deadline,status,assigned_at) VALUES (:id,:pid,:rid,:ab,:dl,:st,:aa)"),
                {"id":raid,"pid":pid,"rid":ri,"ab":admin_id,"dl":datetime.now()+timedelta(days=30),"st":"pending","aa":datetime.now()})

        print(f"  Paper: {title[:55]}... [{status}]")

    c.commit()
    print("\n✅ All sample data populated!")
