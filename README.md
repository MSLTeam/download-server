# MSL-API-V2 Mirror Server
提供下载节点镜像服务



请求方法：

POST /

请求头：authorization：Bearer ${AUTH_TOKEN}

请求内容：url: 需要下载的文件地址



返回内容：服务端会返回一个下载地址，2小时有效，2小时后自动删除文件
