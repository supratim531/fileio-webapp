import os

from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.formparsers import MultiPartParser


app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_headers=["*"],
  allow_methods=["*"],
  allow_credentials=True,
)

MultiPartParser.max_file_size = 2 * 1024 * 1024  # 2MB


# @app.post("/upload")
# async def endpoint(uploadFile: UploadFile):
#   print(f'Inside memory: {uploadFile._in_memory}')
#   print(f'{uploadFile.filename}, {uploadFile.file}')
#   content = await uploadFile.read()

#   # Process the file content here...
#   # print("content:", content)
#   print("content-length:", len(content), "byte(s)")


# # Same as previous method
# @app.post("/upload")
# async def endpoint(uploadFile: bytes = File()):
#   # This is calling the read method of the UploadFile class bts
#   content = uploadFile

#   # Process the file content here...
#   print("content:", content)
#   print("content:", len(content))


# # Read file in chunks
# @app.post("/upload")
# async def endpoint(uploadFile: UploadFile):
#   print(f'Inside memory: {uploadFile._in_memory}')
#   print(f'{uploadFile.filename}, {uploadFile.file}')
#   content = await uploadFile.read(size=2)

#   # Process the file content here...
#   print("content (chunk):", content)
#   print("content-length (chunk):", len(content), "byte(s)")


# # Read file in chunks (this time process all chunks)
# @app.post("/upload")
# async def endpoint(uploadFile: UploadFile):
#   chunk_size = 2
#   print(f'Inside memory: {uploadFile._in_memory}')
#   print(f'{uploadFile.filename}, {uploadFile.file}')

#   while True:
#     chunk = await uploadFile.read(size=chunk_size)

#     if not chunk:
#       break
#     else:
#       # Process the file content here...
#       print("content (chunk):", chunk)
#       print("content-length (chunk):", len(chunk), "byte(s)")


# # Process file directly from the stream of form data
# @app.post("/upload")
# async def endpoint(request: Request):
#   async for data in request.stream():
#     print(f"data: {data}")


UPLOAD_DIR = './uploads'


def calculate_percentage(processed_chunks, total_chunks):
  percentage = (processed_chunks / total_chunks) * 100
  return round(percentage)


@app.post("/upload")
async def upload(
  fileName: str = Form(...),
  chunkIndex: int = Form(...),
  totalChunks: int = Form(...),
  uploadFile: UploadFile = File(...)
):
  chunk = None
  is_complete = False
  file_ext = fileName.rsplit('.', 1)[1]
  file_name = fileName.rsplit('.', 1)[0]
  os.makedirs(UPLOAD_DIR, exist_ok=True)
  chunk_path = os.path.join(UPLOAD_DIR, f'{fileName}.chunk{chunkIndex+1}')

  with open(chunk_path, 'wb') as buffer:
    chunk = await uploadFile.read()
    buffer.write(chunk)

  if chunkIndex + 1 == totalChunks:
    # Merge chunks into a single file
    merged_file_path = os.path.join(UPLOAD_DIR, f'{file_name}.{file_ext}')

    with open(merged_file_path, 'wb') as file_writer:
      for i in range(totalChunks):
        chunk_path = os.path.join(UPLOAD_DIR, f'{fileName}.chunk{i+1}')

        with open(chunk_path, 'rb') as file_reader:
          file_writer.write(file_reader.read())

        os.remove(chunk_path)

      is_complete = True

  chunk_stat = f'{chunkIndex + 1}/{totalChunks}'
  chunk_percentage = calculate_percentage(chunkIndex + 1, totalChunks)

  return {
    "success": True,
    "message": f"Chunk {chunk_stat} uploaded",
    "data": {
      "is_complete": is_complete,
      "file_ext": file_ext,
      "file_name": file_name,
      "chunk_size": len(chunk),
      "total_chunks": totalChunks,
      "current_chunk": chunkIndex + 1,
      "chunk_percentage": chunk_percentage,
    }
  }
