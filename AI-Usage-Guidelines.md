
Identify one task you can improve using an AI tool, and try it out.

As a Data engineer intern, I will likely encounter legacy code or complicated SQL joins. I can paste confusing code into an AI to get a plain-English breakdown of what the data pipeline is doing step-by-step

Review the AI-generated output critically—did it require editing or fact-checking?

I used an AI tool to generate a plain-English explanation of a complex SQL query containing multiple inner joins , which is used to extract data from our databases.
The AI successfully broke down the syntax. It provided a clear, step-by-step summary of which tables were being connected and the basic filtering logic applied in the where clause.
While the explanation was helpful for a high-level overview, I reviewed it critically and found it required editing and domain-specific fact-checking in two key areas:
1 Fact-Checking Business Logic
2 Editing for potenial data leak 

Document one best practice you will follow when using AI tools at Focus Bear.

Sanitizing Data and Stripping Personally Identifiable Information Before Prompting AI.
Many public AI tools use the text you type into them to train future versions of their models. As a data engineer working on LLM optimization, I frequently work with raw datasets, error logs, and database schemas. If I paste a messy JSONL file into an AI to ask for help writing a text-cleaning script, I risk accidentally leaking sensitive user data into the public domain.
