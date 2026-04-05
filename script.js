// Add code to check answers to questions

            // For MCQ
            function check(content) {

                const correctPlaceholder = document.getElementById("correctCapital");

                if (content.innerText != "New Delhi") {
                    content.style.background = "red";
                    correctPlaceholder.innerText = "incorrect";
                } else {
                    content.style.background = "green";
                    correctPlaceholder.innerText = "Correct";
                }
            }

            // for the Free Answer
            function checkSmart() {
                const correctPlaceholder = document.getElementById("correctResponse");
                const freeResponse = document.getElementById("free");

                if (freeResponse.value != "Subcribe") {
                    correctPlaceholder.innerText = "Incorrect";
                    freeResponse.style.background = "red";
                } else {
                    correctPlaceholder.innerText = "Correct";
                    freeResponse.style.background = "green";
                }
            }