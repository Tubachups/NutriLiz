import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/image-search')({
  component: RouteComponent,
})

function RouteComponent() {
  const videoSrc = "http://localhost:5000/video";

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>Live Webcam Feed</h1>
      <div style={{ border: '5px solid #333', display: 'inline-block' }}>
        {/* The browser handles the stream automatically */}
        <img 
          src={videoSrc} 
          alt="Live Video Feed" 
          style={{ width: '100%', maxWidth: '640px' }} 
        />
      </div>
    </div>
  );
}
