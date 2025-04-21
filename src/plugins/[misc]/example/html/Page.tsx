import { useEffect, useState } from 'react';

export default function Page() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Function to handle incoming messages
    const handleMessage = (event: any) => {
      // Make sure we have data
      if (!event.data) return;

      let data;

      // Handle both string and object formats
      if (typeof event.data === 'string') {
        try {
          data = JSON.parse(event.data);
        } catch (error) {
          console.error('Failed to parse message data:', error);
          return;
        }
      } else {
        data = event.data;
      }

      // Check if it's a UI action
      if (data.action === 'ui') {
        console.log('Received UI message:', data.data);
        setMessages((prev) => [
          ...prev,
          data.data.message || 'No message content',
        ]);
      }
    };

    // Add the event listener
    window.addEventListener('message', handleMessage);

    // Signal that the UI is ready to receive messages
    setIsReady(true);

    // Notify the client script that the UI is ready (if using FiveM)
    try {
      fetch('https://example1/uiReady', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ready: true }),
      }).catch((_err) => console.log('UI Ready notification sent'));
    } catch (error) {
      console.log('UI is ready - notification mechanism unavailable');
    }

    // Clean up
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="h-auto min-h-32 bg-red-500 p-4 text-white">
      <h2 className="font-bold">Message Receiver</h2>
      <div className="mt-2">
        <div>UI Ready: {isReady ? 'Yes' : 'Loading...'}</div>
        <div className="mt-2">Received Messages:</div>
        {messages.length === 0 ? (
          <div className="italic">No messages yet</div>
        ) : (
          <ul className="list-disc pl-5">
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
