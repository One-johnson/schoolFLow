import { v } from "convex/values";
import { query } from "./_generated/server";

export const globalSearch = query({
  args: {
    schoolId: v.id("schools"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const query = args.searchQuery.toLowerCase().trim();

    if (!query || query.length < 2) {
      return {
        students: [],
        teachers: [],
        classes: [],
        subjects: [],
      };
    }

    // Search Students
    const allStudents = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const studentResults = await Promise.all(
      allStudents.map(async (student) => {
        const user = await ctx.db.get(student.userId);
        if (!user) return null;

        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const matchesName = fullName.includes(query);
        const matchesStudentId = student.studentId.toLowerCase().includes(query);
        const matchesAdmissionNumber = student.admissionNumber.toLowerCase().includes(query);

        // Only return if at least one field matches
        if (!matchesName && !matchesStudentId && !matchesAdmissionNumber) {
          return null;
        }

        let cls = null;
        let section = null;

        if (student.classId) {
          cls = await ctx.db.get(student.classId);
        }

        if (student.sectionId) {
          section = await ctx.db.get(student.sectionId);
        }

        return {
          id: student._id,
          type: "student" as const,
          title: `${user.firstName} ${user.lastName}`,
          subtitle: `Student ID: ${student.studentId}`,
          metadata: `${cls?.name || "No Class"} ${section?.name ? `- Section ${section.name}` : ""}`,
          data: {
            id: student._id,
            userId: student.userId,
            schoolId: student.schoolId,
            studentId: student.studentId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            photo: user.photo,
            admissionNumber: student.admissionNumber,
            classId: student.classId,
            sectionId: student.sectionId,
            className: cls?.name,
            sectionName: section?.name,
            rollNumber: student.rollNumber,
            dateOfBirth: student.dateOfBirth,
            bloodGroup: student.bloodGroup,
            address: student.address,
            emergencyContact: student.emergencyContact,
            medicalInfo: student.medicalInfo,
            documents: student.documents,
            enrollmentDate: student.enrollmentDate,
            status: student.status,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt,
          },
        };
      })
    );

    const students = studentResults
      .filter((s) => s !== null)
      .slice(0, 10);

    // Search Teachers
    const allTeachers = await ctx.db
      .query("teachers")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const teacherResults = await Promise.all(
      allTeachers.map(async (teacher) => {
        const user = await ctx.db.get(teacher.userId);
        if (!user) return null;

        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const matchesName = fullName.includes(query);
        const matchesEmployeeId = teacher.employeeId.toLowerCase().includes(query);

        // Only return if at least one field matches
        if (!matchesName && !matchesEmployeeId) {
          return null;
        }

        return {
          id: teacher._id,
          type: "teacher" as const,
          title: `${user.firstName} ${user.lastName}`,
          subtitle: `Employee ID: ${teacher.employeeId}`,
          metadata: `${teacher.department} • ${teacher.employmentType.replace("_", " ")}`,
          data: {
            id: teacher._id,
            userId: teacher.userId,
            schoolId: teacher.schoolId,
            employeeId: teacher.employeeId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            photo: user.photo,
            qualifications: teacher.qualifications,
            subjectSpecializations: teacher.subjectSpecializations,
            yearsOfExperience: teacher.yearsOfExperience,
            employmentType: teacher.employmentType,
            department: teacher.department,
            dateOfJoining: teacher.dateOfJoining,
            salary: teacher.salary,
            emergencyContact: teacher.emergencyContact,
            documents: teacher.documents,
            bio: teacher.bio,
            status: teacher.status,
            createdAt: teacher.createdAt,
            updatedAt: teacher.updatedAt,
          },
        };
      })
    );

    const teachers = teacherResults
      .filter((t) => t !== null)
      .slice(0, 10);

    // Search Classes
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const filteredClasses = classes
      .filter((cls) => {
        const matchesName = cls.name.toLowerCase().includes(query);
        const matchesLevel = cls.level.toString().includes(query);
        const matchesYear = cls.academicYear.toLowerCase().includes(query);
        return matchesName || matchesLevel || matchesYear;
      })
      .slice(0, 10)
      .map((cls) => ({
        id: cls._id,
        type: "class" as const,
        title: cls.name,
        subtitle: `Level ${cls.level}`,
        metadata: `Academic Year: ${cls.academicYear}`,
        data: {
          id: cls._id,
          schoolId: cls.schoolId,
          name: cls.name,
          level: cls.level,
          academicYear: cls.academicYear,
          description: cls.description,
          createdAt: cls.createdAt,
          updatedAt: cls.updatedAt,
        },
      }));

    // Search Subjects
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const filteredSubjects = subjects
      .filter((subject) => {
        const matchesCode = subject.subjectCode.toLowerCase().includes(query);
        const matchesName = subject.name.toLowerCase().includes(query);
        const matchesDepartment = subject.department.toLowerCase().includes(query);
        return matchesCode || matchesName || matchesDepartment;
      })
      .slice(0, 10)
      .map((subject) => ({
        id: subject._id,
        type: "subject" as const,
        title: subject.name,
        subtitle: `Code: ${subject.subjectCode}`,
        metadata: `${subject.department} • ${subject.isCore ? "Core" : "Elective"}`,
        data: {
          id: subject._id,
          schoolId: subject.schoolId,
          subjectCode: subject.subjectCode,
          name: subject.name,
          department: subject.department,
          description: subject.description,
          colorCode: subject.colorCode,
          classIds: subject.classIds,
          teacherIds: subject.teacherIds,
          credits: subject.credits,
          isCore: subject.isCore,
          status: subject.status,
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt,
        },
      }));

    return {
      students,
      teachers,
      classes: filteredClasses,
      subjects: filteredSubjects,
    };
  },
});
