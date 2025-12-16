document.addEventListener('DOMContentLoaded', () => {
    const gradePoints = {
      'A+': 4.3, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
    };

    const courseList = document.getElementById('course-list');
    const addCourseBtn = document.getElementById('add-course');
    const calculateGpaBtn = document.getElementById('calculate-gpa');
    const resultsSection = document.getElementById('results');
    const gpaResultEl = document.getElementById('gpa-result');
    const totalCreditsEl = document.getElementById('total-credits');
    const gradingScaleTable = document.getElementById('grading-scale-table');

    let courseCount = 0;

    function populateGradingScale() {
        let tableHtml = '<thead><tr><th>Grade</th><th>Points</th></tr></thead><tbody>';
        for (const [grade, points] of Object.entries(gradePoints)) {
            tableHtml += `<tr><td>${grade}</td><td>${points.toFixed(1)}</td></tr>`;
        }
        tableHtml += '</tbody>';
        gradingScaleTable.innerHTML = tableHtml;
    }

    function addCourse() {
        courseCount++;
        const courseRow = document.createElement('div');
        courseRow.className = 'course-row';
        courseRow.id = `course-${courseCount}`;
        
        courseRow.innerHTML = `
            <input type="text" placeholder="Course Name (optional)" class="course-name">
            <select class="grade">
                ${Object.keys(gradePoints).map(grade => `<option value="${grade}">${grade}</option>`).join('')}
            </select>
            <input type="number" placeholder="Credits" min="0" step="0.5" class="credits">
            <button class="btn-remove-course" data-course-id="${courseCount}">&times;</button>
        `;
        
        courseList.appendChild(courseRow);
        updateCalculateBtnState();

        courseRow.querySelector('.btn-remove-course').addEventListener('click', (e) => {
            removeCourse(e.target.dataset.courseId);
        });
    }

    function removeCourse(id) {
        document.getElementById(`course-${id}`).remove();
        courseCount--;
        updateCalculateBtnState();
    }

    function updateCalculateBtnState() {
        const courses = document.querySelectorAll('.course-row');
        calculateGpaBtn.disabled = courses.length === 0;
    }

    function calculateGPA() {
        const courses = document.querySelectorAll('.course-row');
        let totalPoints = 0;
        let totalCredits = 0;

        courses.forEach(course => {
            const grade = course.querySelector('.grade').value;
            const credits = parseFloat(course.querySelector('.credits').value);

            if (!isNaN(credits) && credits > 0 && gradePoints[grade] !== undefined) {
                totalPoints += gradePoints[grade] * credits;
                totalCredits += credits;
            }
        });

        const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

        gpaResultEl.textContent = gpa;
        totalCreditsEl.textContent = totalCredits;
        resultsSection.style.display = 'block';
    }

    addCourseBtn.addEventListener('click', addCourse);
    calculateGpaBtn.addEventListener('click', calculateGPA);

    // Initial setup
    populateGradingScale();
    addCourse(); // Start with one course row
});
