let totalTopics;
let topicsData = [];

function generateTopicForms() {
    totalTopics = parseInt(document.getElementById('numTopics').value, 10);
    const topicsContainer = document.getElementById('topicsContainer');
    topicsContainer.innerHTML = '';

    for (let i = 1; i <= totalTopics; i++) {
        topicsContainer.innerHTML += `
            <div class="topic-container">
                <h3>Topic ${i}</h3>
                <label for="topicName${i}">Topic Name:</label>
                <input type="text" id="topicName${i}" name="topicName${i}" required><br>
                <label for="hard${i}">Number of hard questions:</label>
                <input type="number" id="hard${i}" name="hard${i}" min="0"><br>
                <label for="medium${i}">Number of medium questions:</label>
                <input type="number" id="medium${i}" name="medium${i}" min="0"><br>
                <label for="easy${i}">Number of easy questions:</label>
                <input type="number" id="easy${i}" name="easy${i}" min="0"><br>
            </div>
        `;
    }
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
}

function processForm(event) {
    event.preventDefault();

    const topicsForm = document.getElementById('topicsForm');
    const formData = new FormData(topicsForm);
    topicsData = [];

    for (let i = 1; i <= totalTopics; i++) {
        const topicName = formData.get(`topicName${i}`);
        const hardQuestions = parseInt(formData.get(`hard${i}`)) || 0;
        const mediumQuestions = parseInt(formData.get(`medium${i}`)) || 0;
        const easyQuestions = parseInt(formData.get(`easy${i}`)) || 0;

        topicsData.push({
            topicName,
            hard: hardQuestions,
            medium: mediumQuestions,
            easy: easyQuestions,
            hardNumbers: [],
            mediumNumbers: [],
            easyNumbers: []
        });
    }

    generateQuestionsForms();
}

function generateQuestionsForms() {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';

    topicsData.forEach((topic, index) => {
        const topicNumber = index + 1;

        if (topic.hard > 0) {
            questionsContainer.innerHTML += `
                <div class="question-container">
                    <h3>${topic.topicName} - Hard Questions</h3>
                    ${generateQuestionInputs(topic.hard, `hard${topicNumber}`)}
                </div>
            `;
        }

        if (topic.medium > 0) {
            questionsContainer.innerHTML += `
                <div class="question-container">
                    <h3>${topic.topicName} - Medium Questions</h3>
                    ${generateQuestionInputs(topic.medium, `medium${topicNumber}`)}
                </div>
            `;
        }

        if (topic.easy > 0) {
            questionsContainer.innerHTML += `
                <div class="question-container">
                    <h3>${topic.topicName} - Easy Questions</h3>
                    ${generateQuestionInputs(topic.easy, `easy${topicNumber}`)}
                </div>
            `;
        }
    });

    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
}

function generateQuestionInputs(count, name) {
    let inputs = '';
    for (let i = 1; i <= count; i++) {
        inputs += `<label for="${name}${i}">Question ${i}:</label>
                   <input type="number" id="${name}${i}" name="${name}${i}" required><br>`;
    }
    return inputs;
}

function processQuestions(event) {
    event.preventDefault();

    const questionsForm = document.getElementById('questionsForm');
    const formData = new FormData(questionsForm);

    topicsData.forEach((topic, index) => {
        const topicNumber = index + 1;
        for (let i = 1; i <= topic.hard; i++) {
            topic.hardNumbers.push(formData.get(`hard${topicNumber}${i}`));
        }
        for (let i = 1; i <= topic.medium; i++) {
            topic.mediumNumbers.push(formData.get(`medium${topicNumber}${i}`));
        }
        for (let i = 1; i <= topic.easy; i++) {
            topic.easyNumbers.push(formData.get(`easy${topicNumber}${i}`));
        }
    });

    displayCSVPreview();
}

function displayCSVPreview() {
    const previewTable = document.getElementById('csvPreviewTable');
    previewTable.innerHTML = '';

    const header = document.createElement('tr');
    header.innerHTML = '<th>Topic</th><th>Level</th><th>Count</th><th>Questions</th>';
    previewTable.appendChild(header);

    topicsData.forEach(topic => {
        if (topic.hardNumbers.length >= 0) {
            appendTopicRow(previewTable, topic.topicName, 'hard', topic.hard, topic.hardNumbers);
        }
        if (topic.mediumNumbers.length >= 0) {
            appendTopicRow(previewTable, topic.topicName, 'medium', topic.medium, topic.mediumNumbers);
        }
        if (topic.easyNumbers.length >= 0) {
            appendTopicRow(previewTable, topic.topicName, 'easy', topic.easy, topic.easyNumbers);
        }
    });

    document.getElementById('step3').style.display = 'none';
    document.getElementById('previewSection').style.display = 'block';
}

function appendTopicRow(table, topicName, level, count, questions) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${topicName}</td>
        <td>${level}</td>
        <td>${count}</td>
        <td>${questions.join('</td><td>')}</td>
    `;
    table.appendChild(row);
}

function downloadCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    let csvRows = [];

    topicsData.forEach(topic => {
        if (topic.hardNumbers.length > 0) {
            csvRows.push(`${topic.topicName},hard,${topic.hard},${topic.hardNumbers.join(',')}`);
        }
        if (topic.mediumNumbers.length > 0) {
            csvRows.push(`${topic.topicName},medium,${topic.medium},${topic.mediumNumbers.join(',')}`);
        }
        if (topic.easyNumbers.length > 0) {
            csvRows.push(`${topic.topicName},easy,${topic.easy},${topic.easyNumbers.join(',')}`);
        }
    });

    csvContent += csvRows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "topics.csv");
    document.body.appendChild(link); // Required for Firefox
    link.click();
}
