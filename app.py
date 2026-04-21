from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from datetime import datetime, date, timedelta
from models import db, Member, Service, Attendance
from sqlalchemy import func

app = Flask(__name__)
app.config["SECRET_KEY"] = "church-attendance-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///attendance.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


def seed_service_types():
    return ["Sunday Service", "Bible Study", "Prayer Meeting", "Youth Service", "Special Event", "Other"]


@app.context_processor
def inject_globals():
    return {"service_types": seed_service_types(), "now": datetime.utcnow()}


# ── Dashboard ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    total_members = Member.query.filter_by(is_active=True).count()
    total_services = Service.query.count()

    recent_services = Service.query.order_by(Service.date.desc()).limit(5).all()

    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    recent_attendance = (
        db.session.query(Service, func.count(Attendance.id).filter(Attendance.present == True))
        .outerjoin(Attendance)
        .filter(Service.date >= thirty_days_ago)
        .group_by(Service.id)
        .order_by(Service.date.desc())
        .limit(6)
        .all()
    )

    avg_attendance = 0
    if recent_services:
        totals = [s.present_count() for s in recent_services]
        avg_attendance = round(sum(totals) / len(totals)) if totals else 0

    return render_template(
        "index.html",
        total_members=total_members,
        total_services=total_services,
        recent_services=recent_services,
        recent_attendance=recent_attendance,
        avg_attendance=avg_attendance,
    )


# ── Members ────────────────────────────────────────────────────────────────────

@app.route("/members")
def members_list():
    search = request.args.get("q", "").strip()
    group_filter = request.args.get("group", "")
    query = Member.query.filter_by(is_active=True)
    if search:
        query = query.filter(
            (Member.first_name.ilike(f"%{search}%")) | (Member.last_name.ilike(f"%{search}%"))
        )
    if group_filter:
        query = query.filter_by(group=group_filter)
    members = query.order_by(Member.last_name).all()
    groups = db.session.query(Member.group).filter(Member.group != None, Member.group != "").distinct().all()
    groups = [g[0] for g in groups]
    return render_template("members/list.html", members=members, search=search, groups=groups, group_filter=group_filter)


@app.route("/members/add", methods=["GET", "POST"])
def member_add():
    if request.method == "POST":
        joined = request.form.get("joined_date")
        member = Member(
            first_name=request.form["first_name"].strip(),
            last_name=request.form["last_name"].strip(),
            email=request.form.get("email", "").strip() or None,
            phone=request.form.get("phone", "").strip() or None,
            group=request.form.get("group", "").strip() or None,
            joined_date=datetime.strptime(joined, "%Y-%m-%d").date() if joined else date.today(),
        )
        db.session.add(member)
        db.session.commit()
        flash(f"{member.full_name} has been added.", "success")
        return redirect(url_for("members_list"))
    return render_template("members/add.html")


@app.route("/members/<int:member_id>")
def member_detail(member_id):
    member = Member.query.get_or_404(member_id)
    records = (
        Attendance.query.filter_by(member_id=member_id)
        .join(Service)
        .order_by(Service.date.desc())
        .limit(20)
        .all()
    )
    return render_template("members/detail.html", member=member, records=records)


@app.route("/members/<int:member_id>/edit", methods=["GET", "POST"])
def member_edit(member_id):
    member = Member.query.get_or_404(member_id)
    if request.method == "POST":
        member.first_name = request.form["first_name"].strip()
        member.last_name = request.form["last_name"].strip()
        member.email = request.form.get("email", "").strip() or None
        member.phone = request.form.get("phone", "").strip() or None
        member.group = request.form.get("group", "").strip() or None
        joined = request.form.get("joined_date")
        if joined:
            member.joined_date = datetime.strptime(joined, "%Y-%m-%d").date()
        db.session.commit()
        flash(f"{member.full_name} has been updated.", "success")
        return redirect(url_for("member_detail", member_id=member.id))
    return render_template("members/edit.html", member=member)


@app.route("/members/<int:member_id>/delete", methods=["POST"])
def member_delete(member_id):
    member = Member.query.get_or_404(member_id)
    member.is_active = False
    db.session.commit()
    flash(f"{member.full_name} has been removed.", "warning")
    return redirect(url_for("members_list"))


# ── Services ───────────────────────────────────────────────────────────────────

@app.route("/services")
def services_list():
    services = Service.query.order_by(Service.date.desc()).all()
    return render_template("services/list.html", services=services)


@app.route("/services/add", methods=["GET", "POST"])
def service_add():
    if request.method == "POST":
        svc_date = request.form["date"]
        service = Service(
            name=request.form["name"].strip(),
            service_type=request.form["service_type"],
            date=datetime.strptime(svc_date, "%Y-%m-%d").date(),
            notes=request.form.get("notes", "").strip() or None,
        )
        db.session.add(service)
        db.session.flush()

        # Pre-populate attendance rows for all active members
        members = Member.query.filter_by(is_active=True).all()
        for m in members:
            db.session.add(Attendance(member_id=m.id, service_id=service.id, present=False))
        db.session.commit()
        flash(f'Service "{service.name}" created.', "success")
        return redirect(url_for("service_attendance", service_id=service.id))
    today_str = date.today().isoformat()
    return render_template("services/add.html", today=today_str)


@app.route("/services/<int:service_id>/attendance", methods=["GET", "POST"])
def service_attendance(service_id):
    service = Service.query.get_or_404(service_id)
    if request.method == "POST":
        present_ids = set(int(x) for x in request.form.getlist("present"))
        records = Attendance.query.filter_by(service_id=service_id).all()
        for record in records:
            record.present = record.member_id in present_ids
        db.session.commit()
        flash("Attendance saved.", "success")
        return redirect(url_for("services_list"))

    records = (
        Attendance.query.filter_by(service_id=service_id)
        .join(Member)
        .order_by(Member.last_name)
        .all()
    )
    # Add any active members who don't yet have a record
    existing_ids = {r.member_id for r in records}
    missing = Member.query.filter_by(is_active=True).filter(~Member.id.in_(existing_ids)).all()
    for m in missing:
        row = Attendance(member_id=m.id, service_id=service_id, present=False)
        db.session.add(row)
    if missing:
        db.session.commit()
        records = (
            Attendance.query.filter_by(service_id=service_id)
            .join(Member)
            .order_by(Member.last_name)
            .all()
        )

    return render_template("services/attendance.html", service=service, records=records)


@app.route("/services/<int:service_id>/delete", methods=["POST"])
def service_delete(service_id):
    service = Service.query.get_or_404(service_id)
    Attendance.query.filter_by(service_id=service_id).delete()
    db.session.delete(service)
    db.session.commit()
    flash("Service deleted.", "warning")
    return redirect(url_for("services_list"))


# ── Reports ────────────────────────────────────────────────────────────────────

@app.route("/reports")
def reports():
    members = Member.query.filter_by(is_active=True).order_by(Member.last_name).all()
    services = Service.query.order_by(Service.date.desc()).all()

    # Overall stats
    service_stats = []
    for s in services[:12]:
        service_stats.append({
            "name": s.name,
            "date": s.date.strftime("%b %d"),
            "present": s.present_count(),
            "total": s.total_count(),
        })

    # Member attendance summary
    member_stats = []
    for m in members:
        total = m.attendance_records.count()
        present = m.attendance_records.filter_by(present=True).count()
        member_stats.append({
            "member": m,
            "total": total,
            "present": present,
            "rate": round((present / total) * 100) if total else 0,
        })
    member_stats.sort(key=lambda x: x["rate"], reverse=True)

    return render_template("reports/index.html", service_stats=service_stats, member_stats=member_stats)


# ── API helpers (for AJAX) ─────────────────────────────────────────────────────

@app.route("/api/toggle-attendance", methods=["POST"])
def toggle_attendance():
    data = request.get_json()
    record = Attendance.query.filter_by(
        member_id=data["member_id"], service_id=data["service_id"]
    ).first()
    if not record:
        return jsonify({"error": "Not found"}), 404
    record.present = not record.present
    db.session.commit()
    return jsonify({"present": record.present})


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
