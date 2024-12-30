import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WorkspacePage = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
    file: null,
  });
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState({}); // To store comments for each workspace

  // Handle file change for workspace
  const handleFileChange = (e) => {
    setNewWorkspace({
      ...newWorkspace,
      file: e.target.files[0],
    });
  };

  // Handle input field change for workspace
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWorkspace({
      ...newWorkspace,
      [name]: value,
    });
  };

  // Create workspace handler
  const handleCreateWorkspace = async () => {
    const authToken = localStorage.getItem('authToken');  // Retrieve the token from localStorage

    if (!authToken) {
      alert('You must be logged in to create a workspace');
      return;
    }

    if (newWorkspace.name && newWorkspace.description) {
      const formData = new FormData();
      formData.append('name', newWorkspace.name);
      formData.append('description', newWorkspace.description);

      // If file is provided, handle file upload
      if (newWorkspace.file) {
        try {
          const fileFormData = new FormData();
          fileFormData.append('file', newWorkspace.file);

          // Upload file to Cloudinary or your server
          const uploadResponse = await axios.post('http://localhost:5000/upload', fileFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const fileUrl = uploadResponse.data.fileUrl;

          // Prepare workspace data with file URL
          const workspaceData = {
            name: newWorkspace.name,
            description: newWorkspace.description,
            fileUrl: fileUrl,
          };

          // Create workspace with token authorization
          const response = await axios.post('http://localhost:5000/workspaces', workspaceData, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          setWorkspaces([...workspaces, response.data]);
          setNewWorkspace({ name: '', description: '', file: null });
        } catch (error) {
          console.error('Error creating workspace:', error);
        }
      } else {
        const workspaceData = {
          name: newWorkspace.name,
          description: newWorkspace.description,
        };

        try {
          // Create workspace without a file
          const response = await axios.post('http://localhost:5000/workspaces', workspaceData, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          setWorkspaces([...workspaces, response.data]);
          setNewWorkspace({ name: '', description: '', file: null });
        } catch (error) {
          console.error('Error creating workspace:', error);
        }
      }
    } else {
      alert('Please fill in all fields');
    }
  };

  // Fetch workspaces from the backend
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await axios.get('http://localhost:5000/workspaces');
        setWorkspaces(response.data);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      }
    };

    fetchWorkspaces();
  }, []);

  // Fetch comments for a specific workspace
  const fetchComments = async (workspaceId) => {
    try {
      const response = await axios.get(`http://localhost:5000/comments/${workspaceId}`);
      setComments((prevComments) => ({
        ...prevComments,
        [workspaceId]: response.data,
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (workspaceId) => {
    const authToken = localStorage.getItem('authToken');  // Retrieve the token from localStorage

    if (!authToken) {
      alert('You must be logged in to post a comment');
      return;
    }

    if (newComment.trim()) {
      try {
        await axios.post('http://localhost:5000/comments', {
          workspaceId,
          comment: newComment,
        }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        // Fetch updated comments after adding the new comment
        fetchComments(workspaceId);
        setNewComment('');
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };

  return (
    <div className="workspace-page">
      <h1>Shared Workspaces</h1>

      {/* Create Workspace Form */}
      <div className="create-workspace-form">
        <input
          type="text"
          name="name"
          value={newWorkspace.name}
          onChange={handleInputChange}
          placeholder="Workspace Name"
        />
        <textarea
          name="description"
          value={newWorkspace.description}
          onChange={handleInputChange}
          placeholder="Workspace Description"
        />
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleCreateWorkspace}>Create Workspace</button>
      </div>

      {/* List of Workspaces */}
      {workspaces.map((workspace) => (
        <div key={workspace.id} className="workspace-card">
          <h2>{workspace.name}</h2>
          <p>{workspace.description}</p>

          {/* Display uploaded file */}
          {workspace.fileUrl && (
            <div>
              <h3>Uploaded File:</h3>
              {workspace.fileUrl.endsWith('.pdf') ? (
                <iframe
                  src={workspace.fileUrl}
                  width="600"
                  height="400"
                  title="Workspace PDF"
                  frameBorder="0"
                ></iframe>
              ) : (
                <img src={workspace.fileUrl} alt="Workspace File" width="300" />
              )}
              {/* Download Link for both image and pdf */}
              <a href={workspace.fileUrl + "?dl=1"} download>
                Download File
              </a>
            </div>
          )}

          {/* Display existing comments */}
          <div>
            <h3>Comments</h3>
            <div>
              {comments[workspace.id]?.map((comment) => (
                <p key={comment.id}>{comment.comment}</p>
              ))}
            </div>
            {/* Add new comment */}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment"
            />
            <button onClick={() => handleCommentSubmit(workspace.id)}>Submit Comment</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkspacePage;
