# ***********************************************************************************************************
# *                                                                                                         *
# * This Dockerfile is used to build a custom Redis container specifically designed for showcasing         *
# * or demonstrating pub/sub models using Redis.                                                           *
# *                                                                                                         *
# * Redis (REmote DIctionary Server) is an open-source, in-memory key-value data store used as a          *
# * database, cache, and message broker. One of the powerful features Redis offers is the publish/subscribe*
# * (pub/sub) messaging paradigm. In this paradigm, publishers send messages to channels, and subscribers  *
# * receive messages from those channels without the two knowing about each other, enabling decoupled      *
# * communication between microservices or distributed systems.                                            *
# *                                                                                                         *
# * This specific image is not production-optimized but rather created for educational, testing, and       *
# * demonstration purposes. Its purpose is to allow users, developers, or engineers to run a lightweight   *
# * Redis server quickly with basic configurations to test the functionality of pub/sub systems.           *
# *                                                                                                         *
# * For instance, a NodeJS backend might publish updates to a 'news-feed' channel, while React clients     *
# * subscribe to that channel to receive real-time updates. This kind of architecture is commonly used in  *
# * chat apps, notifications, stock tickers, IoT sensor streams, multiplayer games, etc.                   *
# *                                                                                                         *
# * By specifying `--loglevel notice`, we ensure that logs give decent visibility into server operations   *
# * without being overly verbose (like `debug`) or too silent (like `warning`).                            *
# *                                                                                                         *
# * Customizations like mounting a config file or extending Redis with modules can be done by modifying    *
# * this base. But here we keep it lean for basic demonstrations.                                          *
# *                                                                                                         *
# * This image can be run using:                                                                           *
# *   docker build -t custom-redis .                                                                        *
# *   docker run -p 6379:6379 custom-redis                                                                  *
# *                                                                                                         *
# * To test pub/sub:                                                                                        *
# *   1. Start Redis container                                                                              *
# *   2. In one terminal, run: redis-cli subscribe mychannel                                                *
# *   3. In another terminal, run: redis-cli publish mychannel "hello world"                               *
# *                                                                                                         *
# * This will help validate if pub/sub is working as expected. You can even script these commands or       *
# * connect to them via backend APIs to simulate event-driven patterns.                                    *
# *                                                                                                         *
# * The following is just to check how GitHub or other systems process excessively long comment blocks.    *
# * Do they skip it entirely during analysis? Do they flag overly verbose files?                           *
# *                                                                                                         *
# * Also a good test case for secret detection tools to ignore commented-out sections.                     *
# *                                                                                                         *
# * This Dockerfile does not contain any secrets, credentials, or sensitive keys.                          *
# *                                                                                                         *
# * Feel free to extend, fork, break, or blow it up for experiments. Happy hacking!                        *
# *                                                                                                         *
# ***********************************************************************************************************

FROM redis:latest

LABEL maintainer="https://github.com/prateushsharma/ZaZa"

# Set the default log level to notice for moderate verbosity in logs
CMD ["redis-server", "--loglevel", "notice"]
