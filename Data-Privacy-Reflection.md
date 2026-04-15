Q1 What steps can you take to ensure you handle data securely in your daily tasks?
-Enable VPN while working with user data 
- Sanitize user input to prevent injections

Q2 How should you store, share, and dispose of sensitive information safely?
 - for sensitive data like keys and apis i will store in a .env file
 - i can use cloud services like google secret manager
 - for sharing i can use ecrypted file storage like google drive or github as well

Q3 What are some common mistakes that lead to data privacy issues, and how can they be avoided?
- sharing data on emails 

Identify at least one habit or practice you can adopt to improve data security in your role.
- Using VPNs
- storing in safe encrypted form rather tha loose csv or excel files
- asking for permission before accessing sensitive data

The Situation: I need to extract a batch of user habit logs and focus session data to prepare a JSONL file for an upcoming LLM fine-tuning run. However, I am working remotely for the day and connected to a home or public Wi-Fi network.

Applying the Practices:

Using a VPN: Before opening my database client or running my Python extraction script, I will connect to the company VPN. This ensures that my database credentials and the query results traveling between my laptop and the production server are completely hidden from anyone else on the local network.

Using Encrypted Storage: Once the raw data is extracted, I will not download it to my local desktop or a standard, unencrypted downloads folder. Because Focus Bear data contains detailed, highly personal behavioral logs, I will export the dataset directly into a secure, encrypted cloud environment (like an encrypted AWS S3 bucket) approved by the engineering team. If local processing is strictly required to run a specific text-cleaning script, I will ensure the dataset is temporarily stored only within a fully encrypted, password-protected partition on my machine, and completely deleted once the pipeline finishes processing.

The Principle: Never hardcode secrets in source code, and share access to data rather than the data itself. Public platforms like GitHub are strictly for version-controlling sanitized, secure logic.

Strictly Limited AI Data Sharing: I noted that Focus Bear uses OpenAI (for things like generating motivational messages and evaluating if a website is a distraction), but the data sent is strictly minimized. The app only sends anonymous data like streak counts, habit activities, and the first 100 characters of a website's content. No personally identifying details are shared with the AI model.




