using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Quobject.SocketIoClientDotNet.Client;
using Microsoft.Kinect;
using Newtonsoft.Json;

namespace KinectClient
{
    class MedianBuffer<T> {
        const int size = 10;

        private List<T> buf = new List<T>();

        public T Push(T x)
        {
            buf.Add(x);

            while(buf.Count > size)
            {
                buf.RemoveAt(0);
            }

            var q = from c in buf
                    group c by x into g
                    let count = g.Count()
                    orderby count descending
                    select new { Value = g.Key, Count = count };

            return q.First().Value;
        }
    }
    class HandUpdate
    {
        public int BodyId { get; set; }
        public bool IsLeft { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public double Z { get; set; }
        public double DX { get; set; }
        public double DY { get; set; }
        public double DZ { get; set; }
        public string Gesture { get; set; }
        public string Confidence { get; set; }


    }
    class KinectClientEndpoint
    {
        public const string DefaultEndpoint = "http://192.168.180.126:8090";
        private const int skip = 2;
        private int count;
        private Socket socket;
        private MedianBuffer<HandState> leftBuffer;
        private MedianBuffer<HandState> rightBuffer;

        public KinectClientEndpoint()
        {
            socket = null;
            count = 0;
            leftBuffer = new MedianBuffer<HandState>();
            rightBuffer = new MedianBuffer<HandState>();
        }

        public void Connect(string url = DefaultEndpoint)
        {
            if (socket != null)
                throw new InvalidOperationException("Already Connected");

            socket = IO.Socket(url);
        }

        public void SendHandUpdate(Body body)
        {
            if (socket == null)
                throw new InvalidOperationException("Not Connected");

            HandUpdate leftUpdate = Create(body.Joints[JointType.HandLeft], body.Joints[JointType.Head], leftBuffer.Push(body.HandLeftState), true, body.HandLeftConfidence, (int)body.TrackingId);
            HandUpdate rightUpdate = Create(body.Joints[JointType.HandRight], body.Joints[JointType.Head], rightBuffer.Push(body.HandRightState), false, body.HandRightConfidence, (int)body.TrackingId);

            count++;

            if (count >= skip)
            {
                socket.Emit("hand", JsonConvert.SerializeObject(leftUpdate));
                socket.Emit("hand", JsonConvert.SerializeObject(rightUpdate));

                count = 0;
            }
        }

        public void SendKeywordRecognized(string word)
        {
            socket.Emit("keyword", word);
        }

        public void Close()
        {
            if (socket == null)
                throw new InvalidOperationException("Not Connected");

            socket.Close();
            socket = null;
        }

        private HandUpdate Create(Joint hand, Joint head, HandState state, bool isLeft, TrackingConfidence confidence, int bodyId)
        {
            return new HandUpdate
            {
                X = hand.Position.X,
                Y = hand.Position.Y,
                Z = hand.Position.Z,
                DX = hand.Position.X - head.Position.X,
                DY = hand.Position.Y - head.Position.Y,
                DZ = hand.Position.Z - head.Position.Z,
                IsLeft = isLeft,
                Gesture = GetHandTrackingState(state), 
                Confidence = GetTrackingConfidence(confidence),
                BodyId = bodyId
            };
        }

        private string GetTrackingConfidence(TrackingConfidence confidence)
        {
            switch (confidence)
            {
                case TrackingConfidence.High: return "high";
            }

            return "low";
        }

        private string GetHandTrackingState(HandState hand)
        {
            switch(hand)
            {
                case HandState.Closed: return "closed";
                case HandState.Lasso: return "lasso";
                case HandState.Open: return "open";
                case HandState.Unknown: return "unknown";
            }

            return "untracked";
        }
    }
}
