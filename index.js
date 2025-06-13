import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8082;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


app.get('/', (req, res) => {
    console.log('GET / request received');
    res.render("main", { 
        corrected: "",
        originalText: "", 
    });
});

app.post('/correct', async (req, res) => {
    console.log('POST /correct request received');
    const text = req.body.text?.trim();
    console.log('Input text:', text);

    if (!text) {
        console.log('No text provided');
        return res.render('main', {
            corrected: 'Please enter the text',
            originalText: text,
        });
    }

    try {
        console.log('Sending request to Gemini API');
        console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
        
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Correct the following text: ${text}`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 100,
                    temperature: 1,
                }
            })
        });

        console.log('API Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`API Error: Status ${response.status} - ${errorText}`);
            return res.render('main', {
                corrected: `API Error: Status ${response.status} - ${errorText}`,
                originalText: text,
            });
        }

        const data = await response.json();
        // console.log('API Response Data:', JSON.stringify(data, null, 2));

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            console.log('Unexpected response structure:', JSON.stringify(data, null, 2));
            return res.render('main', {
                corrected: 'Error: Unexpected API response structure',
                originalText: text,
            });
        }

        const correctedText = data.candidates[0].content.parts[0].text;
        console.log('Corrected Text:', correctedText);

        res.render('main', {
            corrected: correctedText,
            originalText: text,
        });
        
    } catch (error) {
        console.log('Request Error:', error.message, error.stack);
        res.render('main', {
            corrected: `Request Error: ${error.message}`,
            originalText: text,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});