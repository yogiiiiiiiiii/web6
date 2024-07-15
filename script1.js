document.getElementById('csvForm').addEventListener('submit', function(event) {
    event.preventDefault();

    let fileInput = document.getElementById('csvFile');
    let file = fileInput.files[0];
    if (!file) {
        alert('Please select a CSV file.');
        return;
    }

    let confidenceLevel = parseFloat(document.getElementById('confidenceLevel').value) / 100;
    let marginOfError = parseFloat(document.getElementById('marginOfError').value) / 100;

    let reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function(event) {
        let csv = event.target.result;
        let lines = csv.split('\n');

        // Assuming the CSV has a header row with column names
        let headers = lines[0].split(',');

        // Extracting data from CSV excluding header
        let data = lines.slice(1).map(line => line.split(','));

        // Assuming 'tot' is the column for stratification
        let stratifyColumnIndex = headers.indexOf('correct');
        if (stratifyColumnIndex === -1) {
            alert('Column "tot" not found in the CSV file.');
            return;
        }

        // Parse 'tot' column as numeric
        data.forEach(row => row[stratifyColumnIndex] = parseFloat(row[stratifyColumnIndex]));

        // Create bins for 'tot' column
        let numBins = 5;  // Adjust number of bins as needed
        let min = Math.min(...data.map(row => row[stratifyColumnIndex]));
        let max = Math.max(...data.map(row => row[stratifyColumnIndex]));
        let binWidth = (max - min) / numBins;

        let bins = [];
        for (let i = 0; i < numBins; i++) {
            bins.push({ range: [min + i * binWidth, min + (i + 1) * binWidth], rows: [] });
        }

        data.forEach(row => {
            let value = row[stratifyColumnIndex];
            let binIndex = Math.floor((value - min) / binWidth);
            binIndex = Math.min(binIndex, numBins - 1);  // Ensure the value falls within the last bin
            bins[binIndex].rows.push(row);
        });

        // Calculate sample size with the given confidence level and margin of error
        function calculateSampleSize(populationSize, confidenceLevel, marginOfError) {
            let zScore = normInv(1 - (1 - confidenceLevel) / 2);  // Calculate Z-score based on confidence level
            let p = 0.5;  // Proportion of the population
            let numerator = (zScore ** 2) * p * (1 - p);
            let denominator = marginOfError ** 2;
            let sampleSize = (numerator / denominator) / (1 + ((numerator / denominator) - 1) / populationSize);
            return Math.ceil(sampleSize);
        }

        // Function to calculate inverse of the normal cumulative distribution
        function normInv(p) {
            let a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
            let a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
            let b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
            let b4 = 66.8013118877197, b5 = -13.2806815528857;
            let c1 = -7.78489400243029E-03, c2 = -0.322396458041136;
            let c3 = -2.40075827716184, c4 = -2.54973253934373;
            let c5 = 4.37466414146497, c6 = 2.93816398269878;
            let d1 = 7.78469570904146E-03, d2 = 0.32246712907004;
            let d3 = 2.445134137143, d4 = 3.75440866190742;
            let pLow = 0.02425, pHigh = 1 - pLow;
            let q, r;
            if (p < pLow) {
                q = Math.sqrt(-2 * Math.log(p));
                return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
                       ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
            } else if (p <= pHigh) {
                q = p - 0.5;
                r = q * q;
                return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
                       (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
            } else {
                q = Math.sqrt(-2 * Math.log(1 - p));
                return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
                        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
            }
        }

        let populationSize = data.length;
        let sampleSize = calculateSampleSize(populationSize, confidenceLevel, marginOfError);

        // Perform stratified sampling
        function stratifiedSample(data, stratifyColumnIndex, sampleSize) {
            let numBins = 5;
            let min = Math.min(...data.map(row => row[stratifyColumnIndex]));
            let max = Math.max(...data.map(row => row[stratifyColumnIndex]));
            let binWidth = (max - min) / numBins;

            let bins = [];
            for (let i = 0; i < numBins; i++) {
                bins.push({ range: [min + i * binWidth, min + (i + 1) * binWidth], rows: [] });
            }

            data.forEach(row => {
                let value = row[stratifyColumnIndex];
                let binIndex = Math.floor((value - min) / binWidth);
                binIndex = Math.min(binIndex, numBins - 1);
                bins[binIndex].rows.push(row);
            });

            let totalSize = data.length;
            let strataSizes = bins.map(bin => bin.rows.length);
            let stratumSampleSizes = strataSizes.map(size => Math.round(size / totalSize * sampleSize));

            let sampledData = [];
            bins.forEach((bin, index) => {
                let stratumSampleSize = stratumSampleSizes[index];
                let stratumData = bin.rows;
                if (stratumSampleSize >= stratumData.length) {
                    sampledData.push(...stratumData);
                } else {
                    let sampledIndices = [];
                    while (sampledIndices.length < stratumSampleSize) {
                        let randomIndex = Math.floor(Math.random() * stratumData.length);
                        if (!sampledIndices.includes(randomIndex)) {
                            sampledIndices.push(randomIndex);
                        }
                    }
                    sampledIndices.forEach(i => sampledData.push(stratumData[i]));
                }
            });

            return sampledData;
        }

        let sampledData = stratifiedSample(data, stratifyColumnIndex, sampleSize);

        // Displaying sampled data
        let resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<h2>Sampled Data:</h2>';
        let table = '<table><thead><tr>';
        // Display only the third header
        table += `<th>${headers[2]}</th>`;
        table += '</tr></thead><tbody>';
        sampledData.forEach(row => {
            table += '<tr>';
            // Display only the third cell of each row
            table += `<td>${row[2]}</td>`;
            table += '</tr>';
        });
        table += '</tbody></table>';
        resultsDiv.innerHTML += table;

        // Create download button
        let downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download Sampled CSV';
        downloadButton.addEventListener('click', function() {
            // Create a CSV string from sampled data
            let csvContent = "data:text/csv;charset=utf-8,"
                + headers[2] + '\n'
                + sampledData.map(row => row[2]).join('\n');

            // Create a download link and trigger download
            let encodedUri = encodeURI(csvContent);
            let link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "sampled_data.csv");
            document.body.appendChild(link); // Required for Firefox
            link.click();
            document.body.removeChild(link); // Clean up
        });

        // Append download button to results section
        resultsDiv.appendChild(downloadButton);
    };
});
