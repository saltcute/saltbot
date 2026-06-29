export function ContactEmail({ color = "#000000", hostname }: { color?: string; hostname: string }) {
    return (
        <span className="inline">
            <span>contact</span>
            <svg className="inline" width="1rem" height="1rem" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                <title>at</title>
                <path
                    stroke={color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 20.064A9 9 0 1 1 21 12v1.5a2.5 2.5 0 0 1-5 0V8m0 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                />
            </svg>
            <span>{hostname}</span>
        </span>
    );
}

export default ContactEmail;
